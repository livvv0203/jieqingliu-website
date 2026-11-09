import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, normalize, sep } from 'node:path';
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

// Publish Codex project names and totals, never local paths or conversation text.
const db = join(homedir(), '.codex', 'state_5.sqlite');
if (existsSync(db)) {
  try {
    const compactTokens = value => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    const readRows = query => JSON.parse(execFileSync('sqlite3', ['-json', db, query], { encoding: 'utf8' }).trim() || '[]');
    const namedProjects = new Map(readRows('SELECT id, name FROM projects;').map(project => [project.id, project.name]));
    const roots = readRows('SELECT project_id AS projectId, path FROM project_roots ORDER BY length(path) DESC;')
      .map(root => ({ ...root, path: normalize(root.path) }));
    const rows = readRows(`SELECT tokens_used AS tokens, cwd AS workspace, project_id AS projectId FROM threads WHERE source NOT LIKE '{%' ORDER BY created_at;`);
    if (rows.length && rows.every(row => Number.isFinite(row.tokens))) {
      const total = rows.reduce((sum, row) => sum + row.tokens, 0);
      const byProject = new Map();
      for (const row of rows) {
        const workspace = normalize(row.workspace);
        const matchingRoot = roots.find(root => workspace === root.path || workspace.startsWith(`${root.path}${sep}`));
        const projectId = namedProjects.has(row.projectId) ? row.projectId : matchingRoot?.projectId;
        const key = projectId ?? 'outside-projects';
        const label = namedProjects.get(projectId) ?? 'Outside projects';
        const project = byProject.get(key) ?? { label, tokens: 0, isProject: Boolean(projectId) };
        project.tokens += row.tokens;
        byProject.set(key, project);
      }
      const projects = [...byProject.values()].sort((a, b) => b.tokens - a.tokens);
      const projectCount = projects.filter(project => project.isProject).length;
      const asOf = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
      const replaceText = (id, value) => {
        const pattern = new RegExp(`(<(?:strong|b) id="${id}">)[^<]*(<\\/(?:strong|b)>)`);
        html = html.replace(pattern, `$1${value}$2`);
      };
      html = html.replace(/(<strong id="token-total" title=")[^"]*(">)[^<]*(<\/strong>)/,
        `$1${total.toLocaleString('en-US')} tokens$2${compactTokens(total)}$3`);
      replaceText('project-count', projectCount);
      replaceText('session-count', rows.length);
      replaceText('token-asof', asOf);
      const max = projects[0].tokens;
      const bars = projects.map(project => {
        const width = Math.max(3, Math.round(project.tokens / max * 100));
        return `<div class="usage-project-row" title="${escapeHtml(project.label)}: ${project.tokens.toLocaleString('en-US')} tokens"><span class="usage-project-name">${escapeHtml(project.label)}</span><span class="usage-project-track" aria-hidden="true"><i style="--width:${width}%"></i></span><strong>${compactTokens(project.tokens)}</strong></div>`;
      }).join('');
      html = html.replace(/<!-- chart:start -->[\s\S]*?<!-- chart:end -->/, `<!-- chart:start -->${bars}<!-- chart:end -->`);
      console.log(`Codex usage snapshot: ${compactTokens(total)} tokens across ${projectCount} Codex projects and ${rows.length} sessions (${asOf})`);
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
