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

// 彻底清空 localStorage 后只写入「无装饰」草稿，验证 reload 后不会出现残留 cover
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('podcast_draft', '# 一级标题\n\n正文。\n'); });
await page.reload({ waitUntil: 'networkidle0' });
await sleep(2500);
await page.waitForSelector('.milkdown', { timeout: 10000 });
await sleep(500);

const r = await page.evaluate(() => {
  const view = window.__milkdownView;
  const doc = view.state.doc;
  const topTypes = [];
  doc.forEach((n) => topTypes.push(n.type.name + (n.attrs && n.attrs.type ? ':' + n.attrs.type : '')));
  return {
    docTypes: topTypes,
    covers: document.querySelectorAll('.milkdown .milkdown-decor-cover').length,
  };
});
console.log('[clean-load 无装饰草稿] doc=[' + r.docTypes.join(',') + '] covers=' + r.covers);
console.log(r.covers === 0 && r.docTypes.join(',') === 'heading,paragraph' ? 'PASS 无残留 cover' : 'FAIL 出现残留 cover');

await browser.close();
