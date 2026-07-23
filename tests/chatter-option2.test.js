const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const jsx = fs.readFileSync(path.join(root, 'Qi', 'qi-home.jsx'), 'utf8');
const compiled = fs.readFileSync(path.join(root, 'Qi', 'qi-home.compiled.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'Qi', 'index.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const orbitAsset = path.join(root, 'Qi', 'assets', 'chatter-orbit-studio-bg.jpg');
const allPostsManifest = JSON.parse(fs.readFileSync(path.join(root, 'ops', 'production', 'manifests', 'chatter-all-posts-fix-20260722.json'), 'utf8'));

assert.strictEqual((jsx.match(/function SpbChat\(/g) || []).length, 1, 'only the option 2 chat implementation should remain');
assert(jsx.includes('grid-template-columns: 360px minmax(0, 1fr) 370px'), 'desktop chat uses the selected three-column composition');
assert(jsx.includes('话题列表') && jsx.includes('发起新话题') && jsx.includes('社区公约'), 'topic rail, composer, and community rules are present');
assert(jsx.includes('回复当前帖子') && jsx.includes('按时间顺序'), 'thread replies stay in the main reading column');
assert(jsx.includes('visiblePosts.map((post, index) =>') && jsx.includes('当前显示 {visiblePosts.length} 篇帖子'), 'the main column renders every filtered post as a continuous feed');
assert(jsx.includes('id={`chatter-post-${post.id}`}') && !jsx.includes('{selectedPost && visiblePosts.length ?'), 'latest-post navigation scrolls to a feed card instead of replacing the feed with one post');
assert(jsx.includes("topic: composerTopic"), 'new posts submit the selected topic');
assert(jsx.includes('@media (max-width: 780px)') && jsx.includes('flex-direction: column'), 'small screens collapse to a readable single column');
assert(jsx.includes('assets/chatter-orbit-studio-bg.jpg?v=1'), 'selected orbit background asset is used');
assert(fs.existsSync(orbitAsset) && fs.statSync(orbitAsset).size < 150 * 1024, 'orbit background asset is present and lightweight');
assert.deepStrictEqual(allPostsManifest.files.map(file => file.source), ['Qi/index.html', 'Qi/qi-home.jsx', 'Qi/qi-home.compiled.js'], 'all-posts deployment only publishes the homepage bundle');
assert.strictEqual(allPostsManifest.restart, 'none', 'the static feed fix must not restart production services');

assert(server.includes("topic: String(post.topic || '').trim().slice(0, 24)"), 'public chatter payload exposes the topic');
assert(server.includes("const topic = String(body.topic || '').trim().slice(0, 24)"), 'post creation accepts a bounded topic');
assert(server.includes("['/assets/chatter-orbit-studio-bg.jpg', 'Qi/assets/chatter-orbit-studio-bg.jpg']"), 'orbit background is served by the main site');
assert(/const post = \{[\s\S]*?id,[\s\S]*?text,[\s\S]*?topic,[\s\S]*?imageName,/.test(server), 'stored posts retain their topic');

assert(compiled.includes('qi-chat2-shell') && compiled.includes('Respectful, curious, human.'), 'compiled home bundle contains option 2');
assert(index.includes('qi-home.compiled.js?v=20260722-chatter-option2e'), 'homepage cache key is refreshed');

console.log('chatter option 2 checks passed');
