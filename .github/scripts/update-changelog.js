// Usage: VERSION=1.9.0 node update-changelog.js
const fs = require('fs');

const version = process.env.VERSION;
const date = new Date().toISOString().split('T')[0];
const repo = 'https://github.com/tomas2305/platito';

if (!version) {
  console.error('VERSION environment variable is required');
  process.exit(1);
}

let content = fs.readFileSync('CHANGELOG.md', 'utf8');

// Find previous version before modifying content
const prevMatch = content.match(/^## \[(\d+\.\d+\.\d+)\]/m);
const prevVersion = prevMatch?.[1] ?? null;

// Insert new version header right after [Unreleased]
content = content.replace(
  /^## \[Unreleased\]/m,
  `## [Unreleased]\n\n## [${version}] - ${date}`
);

// Build the new version link
const versionLink = prevVersion
  ? `[${version}]: ${repo}/compare/${prevVersion}...${version}`
  : `[${version}]: ${repo}/releases/tag/${version}`;

// Update [Unreleased] link and insert version link below it
if (/^\[Unreleased\]:/m.test(content)) {
  content = content.replace(
    /^\[Unreleased\]:.*$/m,
    `[Unreleased]: ${repo}/compare/${version}...HEAD\n${versionLink}`
  );
} else {
  content += `\n[Unreleased]: ${repo}/compare/${version}...HEAD\n${versionLink}\n`;
}

fs.writeFileSync('CHANGELOG.md', content);
console.log(`CHANGELOG updated: ${version} (previous: ${prevVersion ?? 'none'})`);
