const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const sourcePath = path.join(root, 'qi-home.jsx');
const outputPath = path.join(root, 'qi-home.compiled.js');
const babelUrl = 'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js';

async function main() {
  const res = await fetch(babelUrl);
  if (!res.ok) throw new Error(`Babel download failed: ${res.status}`);

  const context = { window: {}, self: {}, console, setTimeout, clearTimeout };
  context.window = context;
  context.self = context;
  vm.createContext(context);
  vm.runInContext(await res.text(), context);

  const source = fs.readFileSync(sourcePath, 'utf8');
  const compiled = context.Babel.transform(source, {
    presets: ['react'],
    comments: false,
    compact: false,
  }).code;

  fs.writeFileSync(
    outputPath,
    `/* Generated from qi-home.jsx. Do not edit manually. */\n${compiled}\n`,
    'utf8'
  );
  console.log(`Built ${path.relative(process.cwd(), outputPath)}`);
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
