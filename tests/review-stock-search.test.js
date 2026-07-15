// Regression coverage for limit-up review stock search initials.
// The server supplies a stable acronym so matching does not depend solely on
// the visitor browser's Intl pinyin collation support.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const serverSrc = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const pageSrc = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');

function extractFunction(src, name) {
  const match = src.match(new RegExp(`function ${name}\\(`));
  if (!match) throw new Error(`not found: ${name}`);
  const bodyStart = src.indexOf('{', match.index);
  let depth = 0;
  let index = bodyStart;
  for (; index < src.length; index += 1) {
    if (src[index] === '{') depth += 1;
    else if (src[index] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return src.slice(match.index, index + 1);
}

function extractConst(src, name) {
  const start = src.indexOf(`const ${name} =`);
  if (start < 0) throw new Error(`not found: ${name}`);
  const end = src.indexOf(';', start);
  return src.slice(start, end + 1);
}

const serverContext = { Intl };
vm.createContext(serverContext);
vm.runInContext([
  extractConst(serverSrc, 'REVIEW_PINYIN_BOUNDARY_CHARS'),
  extractConst(serverSrc, 'REVIEW_PINYIN_INITIAL_CHARS'),
  extractConst(serverSrc, 'REVIEW_PINYIN_COLLATOR'),
  extractFunction(serverSrc, 'reviewStockNamePinyinInitials'),
  'this.result = reviewStockNamePinyinInitials("海思科");',
].join('\n'), serverContext);

if (serverContext.result !== 'hsk') {
  throw new Error(`server initials mismatch: ${serverContext.result}`);
}

const pageContext = {
  reviewUniverseCache: {
    day: '2026-06-29',
    stocks: [{ code: '002653', name: '海思科', initials: 'hsk' }],
  },
  // Simulate a browser that cannot produce a usable pinyin acronym.
  pinyinInitialsVariants: () => [''],
};
vm.createContext(pageContext);
vm.runInContext([
  extractFunction(pageSrc, 'reviewStockSearchText'),
  extractFunction(pageSrc, 'resolveReviewUniverseCode'),
  'this.searchText = reviewStockSearchText({ code: "002653", name: "海思科" });',
  'this.resolved = resolveReviewUniverseCode("hsk", "2026-06-29");',
].join('\n'), pageContext);

if (!pageContext.searchText.includes('hsk')) throw new Error('review search text misses server initials');
if (pageContext.resolved !== '002653') throw new Error(`hsk did not resolve 002653: ${pageContext.resolved}`);

if (!serverSrc.includes("initials: reviewStockNamePinyinInitials(name)")) {
  throw new Error('recent-universe endpoint does not expose server initials');
}

console.log('ALL REVIEW STOCK SEARCH CHECKS PASSED');
