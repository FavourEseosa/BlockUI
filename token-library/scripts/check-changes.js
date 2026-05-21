const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOKEN_PATH = path.join(__dirname, '..', 'source-tokens', 'tokens.json');
const HASH_PATH = path.join(__dirname, '.tokens-hash');

function getFileHash(filePath) {
  const crypto = require('crypto');
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getSavedHash() {
  if (!fs.existsSync(HASH_PATH)) return null;
  return fs.readFileSync(HASH_PATH, 'utf8').trim();
}

function saveHash(hash) {
  fs.writeFileSync(HASH_PATH, hash);
}

const currentHash = getFileHash(TOKEN_PATH);
const savedHash = getSavedHash();

if (currentHash === savedHash) {
  console.log('✅ tokens.json is up to date (no changes detected)');
  process.exit(0);
} else {
  console.log('⚠️  tokens.json has changed!');
  console.log('   Run "npm run build:all" to regenerate platform outputs');
  console.log('   Or run "npm run watch" to auto-rebuild on changes');

  // Optionally auto-build
  if (process.argv.includes('--build')) {
    console.log('\n🔨 Auto-building...');
    try {
      execSync('npm run build:all', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      saveHash(currentHash);
      console.log('✅ Build complete and hash saved');
    } catch (err) {
      console.error('❌ Build failed:', err.message);
      process.exit(1);
    }
  }

  process.exit(1);
}
