#!/usr/bin/env node
/**
 * verify-deploy.mjs
 * 
 * デプロイ後のURL検証スクリプト
 * 主要ページが正常にアクセスできるか確認する
 * 
 * Usage:
 *   node scripts/verify-deploy.mjs              # デフォルトURL検証
 *   node scripts/verify-deploy.mjs --urls url1,url2  # カスタムURL
 *   node scripts/verify-deploy.mjs --slack      # Slack通知付き
 */

const BASE_URL = 'https://ai.essential-navigator.com';

// 検証対象の主要URL
const DEFAULT_URLS = [
  BASE_URL,
  `${BASE_URL}/news`,
  `${BASE_URL}/category/morning-summary`,
  `${BASE_URL}/category/news`,
];

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(name);

const TIMEOUT = parseInt(getArg('--timeout') || '10000', 10);
const shouldNotifySlack = hasFlag('--slack');
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

async function verifyUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'AI-Solo-Craft-Verify/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return {
      url,
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      url,
      status: 0,
      ok: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
    };
  }
}

async function sendSlackNotification(results) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('⚠️  Slack webhook URL not configured, skipping notification');
    return;
  }

  const allOk = results.every(r => r.ok);
  const failedUrls = results.filter(r => !r.ok);

  const emoji = allOk ? '✅' : '❌';
  const title = allOk
    ? 'デプロイ検証完了 - 全URL正常'
    : `デプロイ検証警告 - ${failedUrls.length}件のエラー`;

  const urlDetails = results
    .map(r => {
      const statusIcon = r.ok ? '✓' : '✗';
      const statusText = r.error || `HTTP ${r.status}`;
      return `${statusIcon} ${r.url} (${statusText})`;
    })
    .join('\n');

  const message = {
    text: `${emoji} ${title}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} ${title}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `\`\`\`${urlDetails}\`\`\`` },
      },
    ],
  };

  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  console.log('📢 Slack notification sent');
}

async function main() {
  console.log('🔍 デプロイ検証を開始...\n');

  // URL決定
  const urlArg = getArg('--urls');
  const urls = urlArg 
    ? urlArg.split(',').map(u => u.trim())
    : DEFAULT_URLS;

  console.log(`検証対象: ${urls.length}件\n`);
  urls.forEach(u => console.log(`  • ${u}`));
  console.log('');

  // 並列で検証
  const results = await Promise.all(urls.map(verifyUrl));

  // 結果を表示
  console.log('📋 検証結果:\n');
  results.forEach(r => {
    const icon = r.ok ? '✅' : '❌';
    const status = r.error || `HTTP ${r.status}`;
    console.log(`${icon} ${r.url}`);
    console.log(`   ${status}\n`);
  });

  // サマリー
  const okCount = results.filter(r => r.ok).length;
  const failCount = results.filter(r => !r.ok).length;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 サマリー: ${okCount}/${results.length} 成功`);

  if (failCount > 0) {
    console.log(`\n⚠️  ${failCount}件のエラーがあります`);
  }

  // Slack通知
  if (shouldNotifySlack) {
    await sendSlackNotification(results);
  }

  // 終了コード
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
