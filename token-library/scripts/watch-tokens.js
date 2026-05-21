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

function saveHash(hash) {
  fs.writeFileSync(HASH_PATH, hash);
}

function getSavedHash() {
  if (!fs.existsSync(HASH_PATH)) return null;
  return fs.readFileSync(HASH_PATH, 'utf8').trim();
}

function buildTokens() {
  console.log('🔨 tokens.json changed — rebuilding...');
  try {
    execSync('npm run build:all', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Build complete');
  } catch (err) {
    console.error('❌ Build failed:', err.message);
  }
}

function checkAndBuild() {
  const currentHash = getFileHash(TOKEN_PATH);
  const savedHash = getSavedHash();

  if (currentHash !== savedHash) {
    buildTokens();
    saveHash(currentHash);
  }
}

// Initial check
console.log('👁️  Watching tokens.json for changes...');
checkAndBuild();

// Watch file
fs.watchFile(TOKEN_PATH, { interval: 1000 }, () => {
  checkAndBuild();
});

// Graceful exit
process.on('SIGINT', () => {
  console.log('\n👋 Stopping watcher');
  fs.unwatchFile(TOKEN_PATH);
  process.exit(0);
});
