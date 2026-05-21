const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TOKEN_PATH = path.join(__dirname, '..', 'source-tokens', 'tokens.json');
const HASH_PATH = path.join(__dirname, '.tokens-hash');

function getFileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

const hash = getFileHash(TOKEN_PATH);

if (process.argv.includes('--save')) {
  fs.writeFileSync(HASH_PATH, hash);
  console.log(`💾 Hash saved: ${hash.slice(0, 16)}...`);
} else {
  console.log(`Current hash: ${hash}`);
  if (fs.existsSync(HASH_PATH)) {
    const saved = fs.readFileSync(HASH_PATH, 'utf8').trim();
    console.log(`Saved hash:   ${saved}`);
    console.log(saved === hash ? '✅ Matches' : '⚠️  Different from saved');
  } else {
    console.log('No saved hash found. Run with --save to create one.');
  }
}
