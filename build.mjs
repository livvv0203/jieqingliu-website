import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { getGithubActivity } from './github-activity.mjs';

const css = readFileSync('styles.css', 'utf8');
const favicon = readFileSync('favicon.svg', 'utf8');
const portrait = readFileSync('profile.jpg');
const portraitDataUrl = `data:image/jpeg;base64,${portrait.toString('base64')}`;
let html = readFileSync('index.html', 'utf8');

// Refresh the public GitHub profile snapshot used by the contribution calendar.
try {
  const activity = await getGithubActivity();
  html = html.replace(/\/\* github-data:start \*\/[\s\S]*?\/\* github-data:end \*\//,
    `/* github-data:start */${JSON.stringify(activity)}/* github-data:end */`);
  console.log(`GitHub snapshot: ${activity.publicRepos} public repositories, ${activity.contributions} contributions (${activity.asOf})`);
} catch (error) {
  console.warn(`Could not refresh GitHub snapshot: ${error.message}`);
  if (process.env.GITHUB_ACTIVITY_REQUIRED === '1') throw error;
}

// Publish aggregate local Codex activity only. Project names, paths, and conversations stay private.
const db = join(homedir(), '.codex', 'state_5.sqlite');
if (existsSync(db)) {
  try {
    const query = `SELECT tokens_used, cwd FROM threads WHERE source NOT LIKE '{%' ORDER BY created_at;`;
    const rows = execFileSync('sqlite3', ['-separator', '|', db, query], { encoding: 'utf8' }).trim().split('\n').filter(Boolean).map(line => {
      const separator = line.indexOf('|');
      return { tokens: Number(line.slice(0, separator)), workspace: line.slice(separator + 1) };
    });
    if (rows.length && rows.every(row => Number.isFinite(row.tokens))) {
      const total = rows.reduce((sum, row) => sum + row.tokens, 0);
      const workspaces = new Set(rows.map(row => row.workspace)).size;
      const asOf = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
      const replaceText = (id, value) => {
        const pattern = new RegExp(`(<(?:strong|b) id="${id}">)[^<]*(<\\/(?:strong|b)>)`);
        html = html.replace(pattern, `$1${value}$2`);
      };
      replaceText('token-total', total.toLocaleString('en-US'));
      replaceText('session-count', rows.length);
      replaceText('workspace-count', workspaces);
      replaceText('token-asof', asOf);
      const max = Math.max(...rows.map(row => row.tokens));
      const bars = rows.map((row, i) => {
        const height = Math.max(3, Math.round(row.tokens / max * 100));
        const number = String(i + 1).padStart(2, '0');
        return `<div class="bar-column" title="Session ${i + 1}: ${row.tokens.toLocaleString('en-US')} tokens"><span class="bar" style="--height:${height}%"></span><small>${number}</small></div>`;
      }).join('');
      html = html.replace(/<!-- chart:start -->[\s\S]*?<!-- chart:end -->/, `<!-- chart:start -->${bars}<!-- chart:end -->`);
      console.log(`Codex usage snapshot: ${total.toLocaleString('en-US')} tokens across ${rows.length} sessions and ${workspaces} workspaces (${asOf})`);
    }
  } catch (error) {
    console.warn(`Could not refresh Codex usage snapshot: ${error.message}`);
  }
}

writeFileSync('index.html', html);

html = html.replace('<link rel="stylesheet" href="/styles.css" />', `<style>${css}</style>`);
html = html.replace('src="/profile.jpg"', `src="${portraitDataUrl}"`);
html = html.replace('href="/favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(favicon)}"`);
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
writeFileSync('dist/index.html', html);
