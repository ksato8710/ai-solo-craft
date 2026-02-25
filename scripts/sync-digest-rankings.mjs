#!/usr/bin/env node

/**
 * Sync digest_rankings and digest_ranking_items from Digest body_markdown
 * This handles digests stored directly in DB (authoring_source: 'db')
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_FILES = ['.env.local', '.env'];

function die(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function stripOuterQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return false;

  const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const normalized = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = normalized.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    const rawValue = normalized.slice(separatorIndex + 1).trim();
    const value = stripOuterQuotes(rawValue).replace(/\\n/g, '\n');
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return true;
}

function loadProjectEnvFiles() {
  const loaded = [];
  for (const envFile of ENV_FILES) {
    if (loadEnvFile(envFile)) loaded.push(envFile);
  }
  return loaded;
}

/**
 * Parse ranking items from digest body_markdown
 * Expected format:
 *   ### 1. [タイトル](/news/slug)
 *   **出典:** [ソース名](URL) — 日付
 */
function parseDigestRankingItems(bodyMarkdown) {
  if (!bodyMarkdown) return [];

  const items = [];
  const lines = bodyMarkdown.split(/\r?\n/);

  let currentRank = null;
  let currentHeadline = null;
  let currentSlug = null;
  let currentSourceUrl = null;

  for (const line of lines) {
    // Match: ### 1. [タイトル](/news/slug) or ### 1. [タイトル](https://...)
    const rankMatch = line.match(/^###\s*(\d+)\.\s*\[([^\]]+)\]\(([^)]+)\)/);
    if (rankMatch) {
      // Save previous item if exists
      if (currentRank !== null && currentHeadline) {
        items.push({
          rank: currentRank,
          headline: currentHeadline,
          slug: currentSlug,
          sourceUrl: currentSourceUrl,
        });
      }

      currentRank = parseInt(rankMatch[1], 10);
      currentHeadline = rankMatch[2].trim();

      const linkTarget = rankMatch[3].trim();
      // Check if it's internal link (/news/slug) or external
      if (linkTarget.startsWith('/news/')) {
        currentSlug = linkTarget.replace('/news/', '');
        currentSourceUrl = null;
      } else {
        currentSlug = null;
        currentSourceUrl = linkTarget.startsWith('http') ? linkTarget : null;
      }
      continue;
    }

    // Match: **出典:** [ソース名](URL)
    const sourceMatch = line.match(/\*\*出典:\*\*\s*\[([^\]]*)\]\(([^)]+)\)/);
    if (sourceMatch && currentRank !== null) {
      const sourceUrl = sourceMatch[2].trim();
      if (sourceUrl.startsWith('http') && !currentSourceUrl) {
        currentSourceUrl = sourceUrl;
      }
    }
  }

  // Save last item
  if (currentRank !== null && currentHeadline) {
    items.push({
      rank: currentRank,
      headline: currentHeadline,
      slug: currentSlug,
      sourceUrl: currentSourceUrl,
    });
  }

  return items;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const loadedEnvFiles = loadProjectEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    die(`Missing Supabase env vars. Loaded env files: ${loadedEnvFiles.join(', ') || 'none'}`);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Get all published digests
  const { data: digests, error: digestError } = await supabase
    .from('contents')
    .select('id, slug, date, body_markdown')
    .eq('content_type', 'digest')
    .eq('status', 'published')
    .order('date', { ascending: false });

  if (digestError) die(`Failed to fetch digests: ${digestError.message}`);
  if (!digests || digests.length === 0) {
    console.log('No digests found');
    return;
  }

  console.log(`Found ${digests.length} digests`);

  // Get all news content for slug->id mapping
  const { data: newsContents, error: newsError } = await supabase
    .from('contents')
    .select('id, slug')
    .eq('content_type', 'news');

  if (newsError) die(`Failed to fetch news: ${newsError.message}`);

  const newsSlugToId = new Map((newsContents || []).map((c) => [c.slug, c.id]));

  // Get existing rankings to delete
  const digestIds = digests.map((d) => d.id);
  const { data: existingRankings } = await supabase
    .from('digest_rankings')
    .select('id')
    .in('digest_content_id', digestIds);

  const existingRankingIds = (existingRankings || []).map((r) => r.id);

  if (dryRun) {
    console.log('\n--- DRY RUN ---');
    let totalItems = 0;
    for (const digest of digests) {
      const items = parseDigestRankingItems(digest.body_markdown);
      if (items.length > 0) {
        console.log(`${digest.slug}: ${items.length} items`);
        items.forEach((item) => {
          const linked = item.slug ? (newsSlugToId.has(item.slug) ? '✓' : '✗') : '-';
          console.log(`  #${item.rank} ${item.headline.slice(0, 40)}... [linked: ${linked}]`);
        });
        totalItems += items.length;
      }
    }
    console.log(`\nTotal: ${totalItems} items across ${digests.length} digests`);
    console.log(`Existing rankings to delete: ${existingRankingIds.length}`);
    return;
  }

  // Delete existing rankings
  if (existingRankingIds.length > 0) {
    await supabase.from('digest_ranking_items').delete().in('ranking_id', existingRankingIds);
    await supabase.from('digest_rankings').delete().in('id', existingRankingIds);
    console.log(`Deleted ${existingRankingIds.length} existing rankings`);
  }

  let rankingsCreated = 0;
  let itemsCreated = 0;

  for (const digest of digests) {
    const items = parseDigestRankingItems(digest.body_markdown);
    if (items.length === 0) continue;

    // Create ranking record
    const digestDate = new Date(`${digest.date}T00:00:00Z`);
    const windowStart = new Date(digestDate);
    windowStart.setDate(windowStart.getDate() - 1);

    const { data: rankingData, error: rankingError } = await supabase
      .from('digest_rankings')
      .insert({
        digest_content_id: digest.id,
        window_start: windowStart.toISOString(),
        window_end: digestDate.toISOString(),
        top_n: Math.min(items.length, 10),
      })
      .select('id')
      .single();

    if (rankingError) {
      console.warn(`⚠ Failed to create ranking for ${digest.slug}: ${rankingError.message}`);
      continue;
    }

    rankingsCreated++;

    // Create ranking items
    const itemRows = items.map((item) => ({
      ranking_id: rankingData.id,
      rank: item.rank,
      headline: item.headline,
      nva_total: 80, // Default score
      source_url: item.sourceUrl,
      news_content_id: item.slug ? newsSlugToId.get(item.slug) || null : null,
    }));

    const { error: itemsError } = await supabase
      .from('digest_ranking_items')
      .insert(itemRows);

    if (itemsError) {
      console.warn(`⚠ Failed to create items for ${digest.slug}: ${itemsError.message}`);
    } else {
      itemsCreated += itemRows.length;
    }
  }

  console.log('\n✅ sync-digest-rankings completed');
  console.log(`- digest_rankings: ${rankingsCreated}`);
  console.log(`- digest_ranking_items: ${itemsCreated}`);
}

main().catch((error) => {
  console.error('\n❌ sync-digest-rankings failed');
  console.error(error);
  process.exit(1);
});
