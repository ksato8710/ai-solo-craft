import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ skillName: string }> }
) {
  try {
    const { skillName } = await params;
    
    // Validate skill name (security check)
    if (!skillName.match(/^[a-zA-Z0-9-_]+$/)) {
      return NextResponse.json({ error: 'Invalid skill name' }, { status: 400 });
    }

    // Resolve known skill locations:
    // - local project .claude/skills/*.md
    // - local project .claude/skills/<name>/SKILL.md
    // - user home .claude/.clawdbot/.codex skill folders
    const homeDir = os.homedir();
    const workspaceDir = process.cwd();
    const candidates = [
      path.join(workspaceDir, '.claude', 'skills', `${skillName}.md`),
      path.join(workspaceDir, '.claude', 'skills', skillName, 'SKILL.md'),
      path.join(homeDir, '.claude', 'skills', `${skillName}.md`),
      path.join(homeDir, '.claude', 'skills', skillName, 'SKILL.md'),
      path.join(homeDir, '.clawdbot', 'skills', skillName, 'SKILL.md'),
      path.join(homeDir, '.codex', 'skills', skillName, 'SKILL.md'),
    ];

    const skillPath = candidates.find((candidate) => fs.existsSync(candidate));

    if (!skillPath) {
      return new NextResponse('スキルファイルが見つかりませんでした。', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
    // Read file content
    const content = fs.readFileSync(skillPath, 'utf-8');
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error reading skill file:', error);
    return NextResponse.json(
      { error: 'スキルファイルの読み込み中にエラーが発生しました。' },
      { status: 500 }
    );
  }
}
