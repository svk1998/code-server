// Parses a "Register a portal" issue-form body and appends the portal to
// portal/portals.json. Communicates result/name/error back to the workflow
// via $GITHUB_OUTPUT. No external dependencies.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const FILE = 'portal/portals.json';

function setOutput(key, value) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return;
  // multiline-safe output using a heredoc delimiter
  const delim = `__EOF_${Math.random().toString(36).slice(2)}__`;
  appendFileSync(out, `${key}<<${delim}\n${value}\n${delim}\n`);
}

function fail(message) {
  setOutput('result', 'failure');
  setOutput('message', message);
  console.error(message);
  process.exit(0); // exit 0 so the workflow can post a friendly comment
}

// Parse "### Heading\n\nvalue" blocks produced by GitHub issue forms.
function parseIssueForm(body) {
  const fields = {};
  const blocks = body.split(/^###[ \t]+/m).slice(1);
  for (const block of blocks) {
    const nl = block.indexOf('\n');
    if (nl === -1) continue;
    const heading = block.slice(0, nl).trim().toLowerCase();
    let value = block.slice(nl + 1).trim();
    if (value === '_No response_' || value === '_No response_\r') value = '';
    fields[heading] = value;
  }
  return fields;
}

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'portal';

const body = process.env.ISSUE_BODY || '';
const f = parseIssueForm(body);

const name = (f['portal name'] || '').trim();
let url = (f['url'] || '').trim();
const category = (f['category'] || '').trim() || 'Uncategorized';
const description = (f['description'] || '').trim();

if (!name) fail('Could not read a **Portal name** from the issue. Please use the "Register a portal" template.');
if (!url) fail('Could not read a **URL** from the issue. Please use the "Register a portal" template.');

if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
try { new URL(url); } catch { fail(`The URL \`${url}\` doesn't look valid.`); }

// Load existing data
let data;
try { data = JSON.parse(readFileSync(FILE, 'utf8')); }
catch (e) { fail(`Could not read ${FILE}: ${e.message}`); }

const portals = Array.isArray(data.portals) ? data.portals : [];

// Reject duplicate URLs
if (portals.some((p) => (p.url || '').replace(/\/+$/, '') === url.replace(/\/+$/, ''))) {
  fail(`A portal with the URL \`${url}\` is already registered.`);
}

// Unique id
let id = slugify(name);
const taken = new Set(portals.map((p) => p.id));
if (taken.has(id)) { let n = 2; while (taken.has(`${id}-${n}`)) n++; id = `${id}-${n}`; }

portals.push({ id, name, url, category, description });

data.team = data.team || 'ISWT Team';
data.updated = new Date().toISOString().slice(0, 10);
data.portals = portals;

writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');

setOutput('result', 'success');
setOutput('name', name);
setOutput('url', url);
setOutput('category', category);
console.log(`Added portal "${name}" (${url}) under "${category}".`);
