const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const payloadPath = path.join(root, 'ops', 'production', 'requests', '2026-07-22-chatter-option2-seed.json');
const scriptPath = path.join(root, 'ops', 'production', 'requests', '2026-07-22-chatter-option2-seed.ps1');
const manifestPath = path.join(root, 'ops', 'production', 'manifests', 'chatter-option2-20260722.json');

const payloadBuffer = fs.readFileSync(payloadPath);
const payload = JSON.parse(payloadBuffer.toString('utf8'));
const script = fs.readFileSync(scriptPath, 'utf8');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const payloadSha = crypto.createHash('sha256').update(payloadBuffer).digest('hex');

assert.strictEqual(payloadSha, 'eed719bfc64f2b1b17939f6e36433d230b3204e8bd201c10b3d1ad6e31a4ae7a');
assert(script.includes(`$ExpectedPayloadSha256 = '${payloadSha}'`), 'production script pins the reviewed seed payload');

assert.strictEqual(payload.posts.length, 5);
assert.strictEqual(new Set(payload.posts.map(post => post.id)).size, 5);
assert.strictEqual(new Set(payload.posts.map(post => post.author)).size, 5);
assert.strictEqual(payload.posts.reduce((sum, post) => sum + post.comments.length, 0), 11);
assert.strictEqual(payload.posts.filter(post => post.imageName).length, 4);
assert(payload.posts.every(post => post.id.startsWith('chat_seed_20260722_')));
assert(payload.posts.every(post => post.text.length >= 90), 'seed posts should contain complete, non-placeholder copy');
assert(payload.posts.flatMap(post => post.comments).every(comment => comment.text.length >= 20), 'seed replies should be substantive');
assert(payload.posts.every(post => ['日常打卡', '一图一张', '碎碎念'].includes(post.topic)));

for (const contract of [
  'backups\\chatter-option2-seed-20260722-',
  'Seed payload SHA-256 mismatch',
  'Staged image SHA-256 mismatch',
  'Local chatter API does not expose all seed posts',
  'Local chatter API does not expose seed topics',
  'rollback was attempted',
  "Remove-Item -LiteralPath $Stage -Recurse -Force",
]) {
  assert(script.includes(contract), `missing production safety contract: ${contract}`);
}

assert.strictEqual(manifest.restart, 'main');
assert.deepStrictEqual(manifest.files.map(file => file.source), [
  'kpl-stats-server.js',
  'Qi/index.html',
  'Qi/qi-home.jsx',
  'Qi/qi-home.compiled.js',
  'Qi/assets/chatter-orbit-studio-bg.jpg',
]);

console.log('chatter production seed checks passed');
