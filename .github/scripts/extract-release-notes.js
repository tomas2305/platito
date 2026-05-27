// Usage: node extract-release-notes.js <version>
const fs = require('fs');

const version = process.argv[2];
if (!version) {
  console.error('Usage: node extract-release-notes.js <version>');
  process.exit(1);
}

const content = fs.readFileSync('CHANGELOG.md', 'utf8');
const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = new RegExp(`## \\[${escaped}\\][^\\n]*\\n(.*?)(?=\\n## \\[|$)`, 's');
const m = content.match(pattern);

process.stdout.write(m ? m[1].trim() : '');
