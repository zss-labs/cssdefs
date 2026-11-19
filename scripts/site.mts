import fs from 'node:fs';
import path from 'node:path';

type Change = { property: string; values: string[] };
type Changes = { date: string; added: Change[]; removed: Change[] };

const root = path.join(import.meta.dirname, '..');
const out = path.join(root, 'site');

const pkg = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
) as { version: string; description: string };
const changes = JSON.parse(
  fs.readFileSync(path.join(root, 'changes.json'), 'utf8'),
) as Changes;
const types = fs.readFileSync(path.join(root, 'index.d.ts'), 'utf8');

const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const list = (title: string, items: Change[]) =>
  items.length === 0
    ? ''
    : `<h3>${title}</h3><ul>${items
        .map(
          ({ property, values }) =>
            `<li><code>${escape(property)}</code>${
              values.length
                ? ` ${values.map((value) => `<code>${escape(value)}</code>`).join(' ')}`
                : ''
            }</li>`,
        )
        .join('')}</ul>`;

const diff =
  changes.added.length || changes.removed.length
    ? list('Added', changes.added) + list('Removed', changes.removed)
    : '<p class="muted">No changes.</p>';

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>cssdefs</title>
<meta name="description" content="${escape(pkg.description)}">
<style>
:root {
  color-scheme: light dark;
  --bg: #fff;
  --fg: #0a0a0a;
  --muted: #737373;
  --border: #e5e5e5;
  --code: #f5f5f5;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #000;
    --fg: #ebebeb;
    --muted: #a3a3a3;
    --border: #262626;
    --code: #141414;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font: 16px/1.6 system-ui, -apple-system, sans-serif;
}
main {
  max-width: 880px;
  margin: 0 auto;
  padding: 96px 24px 64px;
}
h1 {
  margin: 0;
  font-size: 48px;
  font-weight: 650;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
h2 {
  margin: 72px 0 8px;
  font-size: 20px;
  font-weight: 600;
}
h3 {
  margin: 20px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}
p { margin: 12px 0 0; }
a { color: inherit; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
code { font-size: 13px; }
.muted { color: var(--muted); }
.install {
  display: inline-block;
  margin-top: 28px;
  padding: 10px 16px;
  background: var(--code);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.links { margin-top: 20px; font-size: 14px; }
.links a { margin-right: 16px; color: var(--muted); }
ul { margin: 0; padding: 0; list-style: none; }
li { padding: 6px 0; border-top: 1px solid var(--border); }
li code + code { margin-left: 6px; color: var(--muted); }
pre {
  margin: 16px 0 0;
  padding: 20px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.6;
  background: var(--code);
  border: 1px solid var(--border);
  border-radius: 8px;
}
@media (max-width: 640px) {
  main { padding: 64px 16px 48px; }
  h1 { font-size: 40px; }
}
</style>
</head>
<body>
<main>
<h1>cssdefs</h1>
<p>${escape(pkg.description)}.</p>
<code class="install">npm install cssdefs</code>
<p class="links"><a href="https://www.npmjs.com/package/cssdefs">npm</a><a href="https://github.com/zss-labs/cssdefs">GitHub</a></p>

<h2>This week</h2>
<p class="muted">${escape(pkg.version)} · ${escape(changes.date)}</p>
${diff}

<h2>index.d.ts</h2>
<pre><code>${escape(types)}</code></pre>
</main>
</body>
</html>
`;

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log(`Wrote ${path.join(out, 'index.html')}`);
