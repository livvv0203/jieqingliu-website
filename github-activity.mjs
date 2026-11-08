const user = 'livvv0203';
const headers = { 'User-Agent': 'jieqingliu-website', Accept: 'application/vnd.github+json' };

async function getText(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`GitHub returned ${response.status} for ${url}`);
  return response.text();
}

export async function getGithubActivity() {
  const [profileText, calendarHtml] = await Promise.all([
    getText(`https://api.github.com/users/${user}`),
    getText(`https://github.com/users/${user}/contributions`),
  ]);
  const profile = JSON.parse(profileText);
  if (!Number.isInteger(profile.public_repos)) throw new Error('GitHub profile has no public repository count');

  const heading = calendarHtml.match(/id="js-contribution-activity-description"[^>]*>([\s\S]*?)<\/h2>/)?.[1];
  const contributions = Number(heading?.replace(/<[^>]+>/g, ' ').match(/([\d,]+)\s+contributions?/)?.[1].replaceAll(',', ''));
  if (!Number.isFinite(contributions)) throw new Error('GitHub contribution total was not found');

  const days = [...calendarHtml.matchAll(/<td\b[^>]*class="ContributionCalendar-day"[^>]*>/g)]
    .map(([cell]) => ({
      date: cell.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1],
      level: Number(cell.match(/data-level="([0-4])"/)?.[1]),
    }))
    .filter(day => day.date && Number.isInteger(day.level))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 360) throw new Error(`Only ${days.length} contribution days were found`);

  return {
    asOf: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' }),
    publicRepos: profile.public_repos,
    contributions,
    days,
  };
}
