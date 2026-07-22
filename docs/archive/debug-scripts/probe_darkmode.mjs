import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  const orig = console.error;
  console.error = (...args) => {
    const msg = args.map((a) => (a && a.message ? a.message + (a.stack ? '\n' + a.stack : '') : (typeof a === 'string' ? a : JSON.stringify(a)))).join(' ');
    orig.call(console, msg);
  };
});
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

const setDraft = async (md) => {
  await page.evaluate((d) => localStorage.setItem('podcast_draft', d), md);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.milkdown', { timeout: 10000 });
  await sleep(500);
};

// ===== 场景1：深色模式下的编辑器 =====
await page.goto('http://localhost:3000/?theme=dark', { waitUntil: 'networkidle0' });
await setDraft('# 净排标题\n\n这是一段正文，用来验证深色模式下是否清晰可读。\n\n## 小标题');

const editorColors = await page.evaluate(() => {
  const h1 = document.querySelector('.milkdown h1');
  const p = document.querySelector('.milkdown p');
  const cs = (el) => (el ? getComputedStyle(el).color : null);
  const bg = (el) => (el ? getComputedStyle(el).backgroundColor : null);
  return {
    h1Color: cs(h1),
    pColor: cs(p),
    editorBg: bg(document.querySelector('.milkdown .ProseMirror')),
  };
});
console.log('[场景1 编辑器·深色模式]', JSON.stringify(editorColors));

// ===== 场景2：预览「微信深色」开关 =====
// 找到工具栏「微信深色」按钮并点击
const clicked = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.toolbar-item')];
  const btn = items.find((el) => el.textContent.includes('微信深色'));
  if (!btn) return false;
  btn.click();
  return true;
});
await sleep(400);
const previewDark = await page.evaluate(() => {
  const root = document.querySelector('.phone-content') || document.querySelector('.preview-content');
  const h1 = root ? root.querySelector('h1') : null;
  const p = root ? root.querySelector('p') : null;
  const cs = (el) => (el ? getComputedStyle(el).color : null);
  const bg = (el) => (el ? getComputedStyle(el).backgroundColor : null);
  return {
    found: !!root,
    h1Color: cs(h1),
    pColor: cs(p),
    bodyBg: root ? bg(root.querySelector('section') || root.firstElementChild || root) : null,
  };
});
console.log('[场景2 预览·微信深色=开] clicked=', clicked, JSON.stringify(previewDark));

// 关掉开关，确认回到浅色
await page.evaluate(() => {
  const items = [...document.querySelectorAll('.toolbar-item')];
  const btn = items.find((el) => el.textContent.includes('微信深色'));
  btn && btn.click();
});
await sleep(400);
const previewLight = await page.evaluate(() => {
  const root = document.querySelector('.phone-content') || document.querySelector('.preview-content');
  const h1 = root ? root.querySelector('h1') : null;
  const cs = (el) => (el ? getComputedStyle(el).color : null);
  const bg = (el) => (el ? getComputedStyle(el).backgroundColor : null);
  return {
    h1Color: cs(h1),
    bodyBg: root ? bg(root.querySelector('section') || root.firstElementChild || root) : null,
  };
});
console.log('[场景3 预览·微信深色=关]', JSON.stringify(previewLight));

if (logs.length) console.log('--- page logs ---\n' + logs.slice(0, 20).join('\n'));
await browser.close();
