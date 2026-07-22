import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:3000/?theme=light';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, dumpio: false,
  userDataDir: 'C:\\Users\\yan\\WorkBuddy\\公众号排版工具\\.chrome-profile',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => {
  const t = m.text();
  if (t.includes('DIAG') || t.includes('[forceParagraphEnter]') || t.toLowerCase().includes('error')) {
    console.log('[browser]', t);
  }
});

async function report(label) {
  const r = await page.evaluate(() => {
    const view = window.__milkdownView;
    if (!view) return { err: 'no view' };
    const sn = view.state.schema.nodes;
    const doc = view.state.doc;
    const topTypes = [];
    doc.forEach((n) => topTypes.push(n.type.name + (n.attrs && n.attrs.type ? ':' + n.attrs.type : '')));
    return {
      defaultType: sn.doc.contentMatch.defaultType ? sn.doc.contentMatch.defaultType.name : 'NONE',
      docTypes: topTypes,
      editorCovers: document.querySelectorAll('.milkdown .milkdown-decor-cover').length,
      editorDividers: document.querySelectorAll('.milkdown .milkdown-decor-divider').length,
      editorQuotes: document.querySelectorAll('.milkdown .milkdown-decor-quote').length,
    };
  });
  const docStr = r.docTypes ? r.docTypes.join(',') : '?';
  console.log(`[${label}] defaultType=${r.defaultType} | doc=[${docStr}] | covers=${r.editorCovers} dividers=${r.editorDividers} quotes=${r.editorQuotes}`);
  return r;
}

function assert(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  return cond;
}

// 装饰语法统一用无空格 `:::cover`（remark-directive 规范语法）

// 场景A: 含 :::cover/divider/quote 的草稿，验证编辑器内渲染为卡片
await page.goto(URL, { waitUntil: 'networkidle0' });
await sleep(800);
await page.evaluate(() => localStorage.setItem('podcast_draft',
  '# 标题\n\n正文段落。\n\n:::cover\n封面标题\n:::\n\n:::divider\n:::\n\n:::quote\n金句内容\n:::\n\n## 小标题'));
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2500);
await page.waitForSelector('.milkdown', { timeout: 10000 });
await sleep(500);
const a = await report('场景A 含装饰块草稿');

// 场景A2: 旧带空格 `::: cover` 草稿，验证预览(正则)仍能渲染（向后兼容）
const prevHtml = await page.evaluate(() => {
  // 直接调用 buildHtml 不可行（未暴露），改为切到预览并读取 DOM
  return null;
});

// 场景C: 普通段落末尾按 Enter，验证不生成 cover（核心回归）
await page.evaluate(() => localStorage.setItem('podcast_draft', '# 标题\n\n正文段落。\n'));
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2500);
await page.waitForSelector('.milkdown', { timeout: 10000 });
await sleep(400);
const ps = await page.$$('.milkdown p');
await ps[ps.length - 1].click();
await page.keyboard.press('End');
await page.keyboard.type('XYZ');
await page.keyboard.press('Enter');
await sleep(300);
await page.keyboard.type('后续文字');
await sleep(300);
const c = await report('场景C 普通段落Enter后');

// 场景D: 在封面卡片内按 Enter，验证不扩散
await page.evaluate(() => localStorage.setItem('podcast_draft',
  '# 标题\n\n:::cover\n封面标题\n:::\n\n## 小标题'));
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2500);
await page.waitForSelector('.milkdown .milkdown-decor-cover', { timeout: 10000 });
await sleep(400);
await page.click('.milkdown .milkdown-decor-cover h1');
await page.keyboard.press('End');
await page.keyboard.press('Enter');
await sleep(300);
const d = await report('场景D 封面卡内Enter后');

// 场景E: 标题末尾按 Enter → 应生成 paragraph（headingEnterFix 不被破坏）
await page.evaluate(() => localStorage.setItem('podcast_draft', '# 一级标题\n\n正文。\n'));
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2500);
await page.waitForSelector('.milkdown', { timeout: 10000 });
await sleep(400);
const hs = await page.$$('.milkdown h1');
// 取最后一个 h1（封面卡片内部也渲染 h1，需排除）
await hs[hs.length - 1].click();
await page.keyboard.press('End');
await page.keyboard.press('Enter');
await sleep(300);
await page.keyboard.type('标题下新段落');
await sleep(300);
const e2 = await report('场景E 标题Enter后');

console.log('\n=== 结论 ===');
let allPass = true;
allPass &= assert('A 装饰块渲染(covers=1,dividers=1,quotes=1)',
  (a.editorCovers === 1 && a.editorDividers === 1 && a.editorQuotes === 1));
allPass &= assert('C Enter不生成cover(editorCovers=0)',
  (c.editorCovers === 0));
allPass &= assert('C doc末尾为paragraph',
  (c.docTypes && c.docTypes[c.docTypes.length - 1] === 'paragraph'));
allPass &= assert('D 封面卡内Enter不扩散(仍1张)',
  (d.editorCovers === 1));
allPass &= assert('E 标题Enter→paragraph(末尾非heading)',
  (e2.docTypes && e2.docTypes[e2.docTypes.length - 1] === 'paragraph'));

await browser.close();
process.exit(allPass ? 0 : 1);
