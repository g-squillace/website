#!/usr/bin/env node
/**
 * Pipeline import progetti da URL → mockup browser frame → upload DatoCMS + create post.
 *
 * Uso:
 *   npm run import:projects                       # legge data/imports.json
 *   npm run import:projects -- --file=urls.json   # file custom
 *   npm run import:projects -- --url=https://... --title="Nome"  # singolo
 *   npm run import:projects -- --dry              # niente upload/create, salva PNG in /tmp
 *
 * Richiede: DATOCMS_FULLACCESS_TOKEN in .env, model `post` con slug/title/blog_image.
 */

import { readFile, mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import slugify from 'slugify';
import { buildClient } from '@datocms/cma-client-node';
import { marked } from 'marked';
import { parse5ToStructuredText } from 'datocms-html-to-structured-text';
import { parse } from 'parse5';

// ---------- Config ----------
const TOKEN = process.env.DATOCMS_FULLACCESS_TOKEN;
const POST_MODEL_API_KEY = 'post';
const LOCALE = 'it';

// Palette ciclica per lo sfondo del mockup (coerente col sito)
const PALETTE = ['#FF5354', '#D6DF4A', '#FFB5D2', '#E0C8BB', '#0900FF'];

// Dimensioni — browser
const SHOT_W = 1440;
const SHOT_H = 900;
const PAD = 80;
const CHROME_H = 64;
const CORNER = 16;
const FINAL_W = SHOT_W + PAD * 2;
const FINAL_H = SHOT_H + CHROME_H + PAD * 2;

// Dimensioni — phone
const PHONE_SHOT_W = 390;
const PHONE_SHOT_H = 844;
const PHONE_BEZEL = 14;
const PHONE_CORNER = 56;
const PHONE_W = PHONE_SHOT_W + PHONE_BEZEL * 2;
const PHONE_H = PHONE_SHOT_H + PHONE_BEZEL * 2;
const PHONE_PAD_X = 360;
const PHONE_PAD_Y = 100;
const PHONE_FINAL_W = PHONE_W + PHONE_PAD_X * 2;
const PHONE_FINAL_H = PHONE_H + PHONE_PAD_Y * 2;

// CSS che nasconde i banner di consenso cookie più diffusi
const HIDE_COOKIE_BANNERS_CSS = `
  [id^="iubenda" i], [class^="iubenda" i],
  [id*="iubenda" i], [class*="iubenda" i],
  .iub-overlay, #iubenda-iframe, #iubenda-cs-banner,
  [id^="onetrust" i], [class^="onetrust" i],
  [id*="onetrust" i], [class*="onetrust" i],
  #CybotCookiebotDialog, [id^="Cookiebot" i],
  #cmplz-cookiebanner-container, .cmplz-cookiebanner,
  [id*="cookie-consent" i], [class*="cookie-consent" i],
  [id*="cookie-banner" i], [class*="cookie-banner" i],
  [id^="cookielaw" i], [class^="cookielaw" i],
  [id*="cookienotice" i], [class*="cookienotice" i],
  [id*="cookieconsent" i], [class*="cookieconsent" i],
  .cc-window, .cc-overlay, .cc-banner,
  [aria-label*="cookie" i][role="dialog"],
  [aria-label*="consenso" i][role="dialog"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
  html, body { overflow: auto !important; }
`;

// ---------- CLI args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);
const DRY = !!args.dry;

// ---------- Helpers ----------
function makeSlug(title) {
  return slugify(title, { lower: true, strict: true, locale: 'it' });
}

function pickBgColor(index) {
  return PALETTE[index % PALETTE.length];
}

/**
 * SVG della barra browser stile macOS: traffic lights + address bar con URL.
 */
function browserChromeSvg(url, width, height) {
  const safeUrl = url.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const addressY = height / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#f5f5f5"/>
    <circle cx="28" cy="${addressY}" r="7" fill="#ff5f57"/>
    <circle cx="50" cy="${addressY}" r="7" fill="#febc2e"/>
    <circle cx="72" cy="${addressY}" r="7" fill="#28c840"/>
    <rect x="${width / 2 - 200}" y="${addressY - 14}" width="400" height="28" rx="14" fill="#ffffff" stroke="#e0e0e0"/>
    <text x="${width / 2}" y="${addressY + 4}"
          font-family="-apple-system, system-ui, sans-serif" font-size="13" fill="#666"
          text-anchor="middle">${safeUrl}</text>
  </svg>`;
}

async function screenshotUrl(url, { device = 'browser' } = {}) {
  const isPhone = device === 'phone';
  const viewport = isPhone
    ? { width: PHONE_SHOT_W, height: PHONE_SHOT_H }
    : { width: SHOT_W, height: SHOT_H };
  const ua = isPhone
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0 Safari/537.36';

  console.log(`  → screenshot (${device}) ${url}`);
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
      isMobile: isPhone,
      hasTouch: isPhone,
      userAgent: ua,
    });
    const page = await ctx.newPage();
    // Inietta il CSS che nasconde i cookie banner prima del primo paint
    await page.addInitScript((css) => {
      const style = document.createElement('style');
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }, HIDE_COOKIE_BANNERS_CSS);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(async (e) => {
      console.warn(`     networkidle timeout, fallback to domcontentloaded:`, e.message);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    });

    // Backup: alcuni banner si attaccano via JS DOPO il load → re-iniezione
    await page.addStyleTag({ content: HIDE_COOKIE_BANNERS_CSS }).catch(() => {});
    await page.waitForTimeout(2500);

    const buf = await page.screenshot({ type: 'png', fullPage: false });
    return buf;
  } finally {
    await browser.close();
  }
}

async function composeMockup({ screenshot, url, bgColor, device = 'browser' }) {
  if (device === 'phone') {
    return composePhoneMockup({ screenshot, bgColor });
  }
  return composeBrowserMockup({ screenshot, url, bgColor });
}

/**
 * Placeholder generico per quando non vogliamo (ancora) lo screenshot vero.
 * Canvas colorato, label "PLACEHOLDER" piccola in alto, titolo a tutta larghezza.
 */
async function composePlaceholder({ title, bgColor }) {
  const W = 1600;
  const H = 900;
  const safeTitle = String(title)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Word wrap molto semplice: max ~16 char per riga
  const words = safeTitle.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > 16 && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);

  const fontSize = lines.length <= 1 ? 110 : lines.length === 2 ? 96 : 80;
  const lineH = fontSize * 1.1;
  const startY = H / 2 - ((lines.length - 1) * lineH) / 2 + fontSize / 3;

  const textNodes = lines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${startY + i * lineH}"
           font-family="-apple-system, system-ui, 'Helvetica Neue', Arial, sans-serif"
           font-size="${fontSize}" font-weight="900" fill="#ffffff" text-anchor="middle"
           letter-spacing="-2">${line}</text>`,
    )
    .join('');

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
       <rect width="${W}" height="${H}" fill="${bgColor}"/>
       <text x="${W / 2}" y="140"
             font-family="-apple-system, system-ui, sans-serif"
             font-size="32" font-weight="600" letter-spacing="8"
             fill="rgba(255,255,255,0.7)" text-anchor="middle">PLACEHOLDER</text>
       ${textNodes}
     </svg>`,
  );

  return await sharp(svg).png({ quality: 92, compressionLevel: 9 }).toBuffer();
}

async function composeBrowserMockup({ screenshot, url, bgColor }) {
  // Screenshot Playwright è a deviceScaleFactor 2 (retina), lo riporto a 1x
  // così le dimensioni combaciano col device buffer logico.
  const screenshot1x = await sharp(screenshot)
    .resize(SHOT_W, SHOT_H, { fit: 'fill' })
    .toBuffer();

  // 1) Compongo browser chrome (in alto) + screenshot (sotto) in un buffer "device"
  const deviceW = SHOT_W;
  const deviceH = SHOT_H + CHROME_H;
  const chromeSvg = Buffer.from(browserChromeSvg(url, deviceW, CHROME_H));

  const deviceBuf = await sharp({
    create: {
      width: deviceW,
      height: deviceH,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: chromeSvg, top: 0, left: 0 },
      { input: screenshot1x, top: CHROME_H, left: 0 },
    ])
    .png()
    .toBuffer();

  // 2) Arrotondo gli angoli + applico ombra (overlay su sfondo colorato)
  const roundedMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${deviceW}" height="${deviceH}">
       <rect width="${deviceW}" height="${deviceH}" rx="${CORNER}" ry="${CORNER}" fill="#fff"/>
     </svg>`,
  );
  const roundedDevice = await sharp(deviceBuf)
    .composite([{ input: roundedMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 3) Sfondo finale colorato + device centrato con ombra (drop shadow tramite blur)
  const shadowOffset = 24;
  const shadowBuf = await sharp({
    create: {
      width: deviceW,
      height: deviceH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.35 },
    },
  })
    .composite([{ input: roundedMask, blend: 'dest-in' }])
    .blur(20)
    .png()
    .toBuffer();

  const final = await sharp({
    create: {
      width: FINAL_W,
      height: FINAL_H,
      channels: 4,
      background: bgColor,
    },
  })
    .composite([
      { input: shadowBuf, top: PAD + shadowOffset, left: PAD + shadowOffset / 2 },
      { input: roundedDevice, top: PAD, left: PAD },
    ])
    .png({ quality: 92, compressionLevel: 9 })
    .toBuffer();

  return final;
}

async function composePhoneMockup({ screenshot, bgColor }) {
  // Screenshot a 1x logico
  const screenshot1x = await sharp(screenshot)
    .resize(PHONE_SHOT_W, PHONE_SHOT_H, { fit: 'fill' })
    .toBuffer();

  // Maschera tonda dello screenshot (angoli arrotondati dello schermo interno)
  const innerCorner = PHONE_CORNER - PHONE_BEZEL;
  const innerMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PHONE_SHOT_W}" height="${PHONE_SHOT_H}">
       <rect width="${PHONE_SHOT_W}" height="${PHONE_SHOT_H}" rx="${innerCorner}" ry="${innerCorner}" fill="#fff"/>
     </svg>`,
  );
  const roundedShot = await sharp(screenshot1x)
    .composite([{ input: innerMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Cornice del telefono: rettangolo nero arrotondato + bezel + notch (dynamic island)
  const islandW = 120;
  const islandH = 32;
  const islandX = (PHONE_W - islandW) / 2;
  const islandY = 14;
  const frameSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PHONE_W}" height="${PHONE_H}">
       <rect width="${PHONE_W}" height="${PHONE_H}" rx="${PHONE_CORNER}" ry="${PHONE_CORNER}"
             fill="#111"/>
       <rect x="${islandX}" y="${islandY}" width="${islandW}" height="${islandH}" rx="${islandH / 2}" ry="${islandH / 2}"
             fill="#000"/>
     </svg>`,
  );

  // Compongo: cornice + screenshot dentro la cornice (offset = bezel)
  const phoneBuf = await sharp(frameSvg)
    .composite([{ input: roundedShot, top: PHONE_BEZEL, left: PHONE_BEZEL }])
    .png()
    .toBuffer();

  // Maschera esterna per arrotondare la cornice del phone (ridondante ma garantita)
  const outerMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PHONE_W}" height="${PHONE_H}">
       <rect width="${PHONE_W}" height="${PHONE_H}" rx="${PHONE_CORNER}" ry="${PHONE_CORNER}" fill="#fff"/>
     </svg>`,
  );
  const roundedPhone = await sharp(phoneBuf)
    .composite([{ input: outerMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Drop shadow blurred
  const shadowOffset = 30;
  const shadowBuf = await sharp({
    create: {
      width: PHONE_W,
      height: PHONE_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0.45 },
    },
  })
    .composite([{ input: outerMask, blend: 'dest-in' }])
    .blur(28)
    .png()
    .toBuffer();

  // Canvas finale colorato + phone centrato con ombra
  const final = await sharp({
    create: {
      width: PHONE_FINAL_W,
      height: PHONE_FINAL_H,
      channels: 4,
      background: bgColor,
    },
  })
    .composite([
      {
        input: shadowBuf,
        top: PHONE_PAD_Y + shadowOffset,
        left: PHONE_PAD_X + Math.round(shadowOffset / 3),
      },
      { input: roundedPhone, top: PHONE_PAD_Y, left: PHONE_PAD_X },
    ])
    .png({ quality: 92, compressionLevel: 9 })
    .toBuffer();

  return final;
}

async function ensureUniqueSlug(client, slug) {
  // Cerco un post esistente con quel slug per gestire l'idempotenza
  const existing = await client.items.list({
    filter: {
      type: POST_MODEL_API_KEY,
      fields: { slug: { eq: slug } },
    },
    page: { limit: 1 },
  });
  return existing[0]?.id ?? null;
}

async function loadCaseStudyDast(slug) {
  const mdPath = path.join('data', 'case-studies', `${slug}.md`);
  if (!existsSync(mdPath)) return null;
  const md = await readFile(mdPath, 'utf8');
  const html = await marked.parse(md);
  // parse5 → AST → DAST (in Node niente DOMParser)
  const tree = parse(html);
  const dast = await parse5ToStructuredText(tree);
  return dast;
}

async function processOne(item, index, client) {
  const {
    url,
    title,
    device,
    year,
    abstract,
    placeholder,
    website_url,
    budget_tier,
    update_only,
    slug: slugOverride,
  } = item;
  const usePlaceholder = !!placeholder || !!args.placeholder;
  console.log(`\n[${index + 1}] ${title}`);
  console.log(`    url: ${url || '(nessun url — placeholder)'}`);

  const bg = pickBgColor(index);
  const slug = slugOverride || makeSlug(title);
  const dev = device || 'browser';
  console.log(
    `    slug: ${slug}, bg: ${bg}, device: ${dev}, year: ${year ?? '—'}, placeholder: ${usePlaceholder}`,
  );

  // Carico content da data/case-studies/<slug>.md se presente
  const contentDast = await loadCaseStudyDast(slug);
  if (contentDast) console.log(`    case study trovato (${slug}.md → DAST)`);

  const existingId = await ensureUniqueSlug(client, slug);

  // Se update_only e l'item esiste già, salta upload immagine
  const skipImage = update_only && existingId;

  let uploadId = null;
  if (!skipImage) {
    let mockup;
    if (usePlaceholder) {
      mockup = await composePlaceholder({ title, bgColor: bg });
      console.log(`    placeholder ok (${(mockup.length / 1024).toFixed(0)}KB)`);
    } else {
      const screenshot = await screenshotUrl(url, { device: dev });
      console.log(`    screenshot ok (${(screenshot.length / 1024).toFixed(0)}KB)`);
      mockup = await composeMockup({ screenshot, url, bgColor: bg, device: dev });
      console.log(`    mockup ok (${(mockup.length / 1024).toFixed(0)}KB)`);
    }

    if (DRY) {
      const dryPath = path.join('/tmp', `mockup-${slug}.png`);
      await writeFile(dryPath, mockup);
      console.log(`    [dry] salvato in ${dryPath}`);
      return;
    }

    console.log(`    upload su DatoCMS...`);
    const tmpPath = path.join('/tmp', `mockup-${slug}-${Date.now()}.png`);
    await writeFile(tmpPath, mockup);
    try {
      const upload = await client.uploads.createFromLocalFile({
        localPath: tmpPath,
        filename: `${slug}.png`,
        default_field_metadata: {
          [LOCALE]: {
            alt: `Anteprima del sito ${title}`,
            title: title,
            custom_data: {},
          },
        },
      });
      uploadId = upload.id;
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
    console.log(`    upload id: ${uploadId}`);
  } else {
    console.log(`    skip image (update_only)`);
    if (DRY) return;
  }

  const payload = {
    title: { [LOCALE]: title },
    slug: { [LOCALE]: slug },
  };
  if (uploadId) {
    payload.blog_image = { upload_id: uploadId };
  }
  if (typeof year === 'number') {
    payload.year = year;
  }
  if (typeof abstract === 'string' && abstract.length > 0) {
    payload.abstract = { [LOCALE]: abstract };
  }
  if (contentDast) {
    payload.content = { [LOCALE]: contentDast };
  }
  if (typeof website_url === 'string' && website_url.length > 0) {
    payload.website_url = website_url;
  }
  if (typeof budget_tier === 'string' && budget_tier.length > 0) {
    payload.budget_tier = budget_tier;
  }

  let targetId;
  if (existingId) {
    console.log(`    aggiorno post esistente ${existingId}`);
    await client.items.update(existingId, payload);
    targetId = existingId;
  } else {
    console.log(`    creo nuovo post`);
    const created = await client.items.create({
      item_type: { type: 'item_type', id: '2076700' },
      ...payload,
    });
    targetId = created.id;
  }
  // Pubblica sempre (anche dopo update, altrimenti i campi nuovi
  // restano "draft" e GraphQL non li espone)
  console.log(`    pubblicazione...`);
  await client.items.publish(targetId);
  console.log(`    ✓ fatto`);
}

// ---------- Main ----------
async function main() {
  if (!TOKEN && !DRY) {
    console.error('ERRORE: DATOCMS_FULLACCESS_TOKEN mancante in .env');
    process.exit(1);
  }

  let items = [];
  if (args.url) {
    items = [
      {
        url: args.url,
        title: args.title || args.url,
        device: args.device,
        year: args.year ? Number(args.year) : undefined,
        abstract: args.abstract,
      },
    ];
  } else {
    const file = args.file || 'data/imports.json';
    if (!existsSync(file)) {
      console.error(`ERRORE: file ${file} non trovato. Vedi data/imports.example.json`);
      process.exit(1);
    }
    items = JSON.parse(await readFile(file, 'utf8'));
  }

  console.log(`Trovati ${items.length} progetti da importare (dry=${DRY})`);
  const client = DRY ? null : buildClient({ apiToken: TOKEN });

  await mkdir('/tmp', { recursive: true });
  for (let i = 0; i < items.length; i++) {
    try {
      await processOne(items[i], i, client);
    } catch (err) {
      console.error(`    ✗ ERRORE su ${items[i].url}:`, err.message);
    }
  }
  console.log(`\nDone.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
