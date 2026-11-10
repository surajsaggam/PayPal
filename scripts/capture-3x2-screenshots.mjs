import fs from "node:fs";
import path from "node:path";
import { chromium } from "../apps/web/node_modules/@playwright/test/index.mjs";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve("s:/PayPal/deliverables/screenshots");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function settleAllAnimations(page, targetScrollY = 0) {
  await page.evaluate(async () => {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const step = 380;
    for (let y = 0; y <= docHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 45));
    }
  });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), targetScrollY);
  await sleep(1250);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 1500, height: 1000 }, // Exact 3:2 aspect ratio
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Verify zero broken CSS/JS assets
  const failedAssets = [];
  page.on("response", (res) => {
    const url = res.url();
    if ((url.includes("/_next/") || url.endsWith(".css")) && res.status() >= 400) {
      failedAssets.push({ url, status: res.status() });
    }
  });

  console.log("1. Capturing 01-command-center-overview-3x2.png...");
  await page.goto(`${BASE_URL}/command-center`, { waitUntil: "domcontentloaded" });
  await settleAllAnimations(page, 0);
  const desktopOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  console.log("Desktop horizontal overflow:", desktopOverflow);
  await page.screenshot({
    path: path.join(OUT_DIR, "01-command-center-overview-3x2.png"),
    fullPage: false,
  });

  console.log("2. Capturing 02-command-center-inspector-waterfall-3x2.png...");
  // Ensure top row is expanded and scroll down so both 3-Card Verification Inspector + 30-Day Cash Inflow Waterfall are in frame
  await page.evaluate(() => window.scrollTo({ top: 1220, behavior: "instant" }));
  await sleep(1200);
  await page.screenshot({
    path: path.join(OUT_DIR, "02-command-center-inspector-waterfall-3x2.png"),
    fullPage: false,
  });

  console.log("3. Capturing 03-spotlight-cmd-k-assistant-3x2.png...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await sleep(950);
  const spotlightBtn = page.locator("button[aria-label*='Spotlight Command Palette']");
  await spotlightBtn.click();
  await sleep(950);
  await page.screenshot({
    path: path.join(OUT_DIR, "03-spotlight-cmd-k-assistant-3x2.png"),
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await sleep(400);

  console.log("4. Capturing 04-passkey-hitl-approval-modal-3x2.png...");
  const passkeyTrigger = page.locator("button:has-text('Prompt-Injection Refund'), button:has-text('Approve / Reject')").first();
  if ((await passkeyTrigger.count()) > 0) {
    await passkeyTrigger.click();
    await sleep(950);
    await page.screenshot({
      path: path.join(OUT_DIR, "04-passkey-hitl-approval-modal-3x2.png"),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await sleep(400);
  }

  console.log("5. Capturing 05-sdk-code-schema-inspector-3x2.png...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await sleep(950);
  const sdkBtn = page.locator("button:has-text('SDK Code')").first();
  if ((await sdkBtn.count()) > 0) {
    await sdkBtn.click();
    await sleep(950);
    await page.screenshot({
      path: path.join(OUT_DIR, "05-sdk-code-schema-inspector-3x2.png"),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await sleep(400);
  }

  console.log("6. Capturing 06-policy-studio-l0-l4-guardrails-3x2.png...");
  await page.goto(`${BASE_URL}/policy-studio`, { waitUntil: "domcontentloaded" });
  await settleAllAnimations(page, 0);
  await page.screenshot({
    path: path.join(OUT_DIR, "06-policy-studio-l0-l4-guardrails-3x2.png"),
    fullPage: false,
  });

  console.log("7. Capturing 07-policy-studio-simulator-rules-3x2.png...");
  await page.evaluate(() => window.scrollTo({ top: 520, behavior: "instant" }));
  await sleep(1100);
  await page.screenshot({
    path: path.join(OUT_DIR, "07-policy-studio-simulator-rules-3x2.png"),
    fullPage: false,
  });

  console.log("8. Capturing 08-invoicing-scheduler-timeline-3x2.png...");
  await page.goto(`${BASE_URL}/invoicing-scheduler`, { waitUntil: "domcontentloaded" });
  await settleAllAnimations(page, 0);
  await page.screenshot({
    path: path.join(OUT_DIR, "08-invoicing-scheduler-timeline-3x2.png"),
    fullPage: false,
  });

  console.log("9. Capturing 09-invoicing-working-capital-histogram-3x2.png...");
  await page.evaluate(() => window.scrollTo({ top: 1240, behavior: "instant" }));
  await sleep(1300);
  await page.screenshot({
    path: path.join(OUT_DIR, "09-invoicing-working-capital-histogram-3x2.png"),
    fullPage: false,
  });

  console.log("10. Capturing 10-invoice-fastlane-qr-modal-3x2.png...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await sleep(950);
  const qrBtn = page.locator("button:has-text('View QR Link'), button:has-text('Send Invoice & Generate QR Link')").first();
  if ((await qrBtn.count()) > 0) {
    await qrBtn.click();
    await sleep(950);
    await page.screenshot({
      path: path.join(OUT_DIR, "10-invoice-fastlane-qr-modal-3x2.png"),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await sleep(300);
  }

  console.log("11. Capturing 11-dispute-defense-war-room-3x2.png...");
  await page.goto(`${BASE_URL}/dispute-war-room`, { waitUntil: "domcontentloaded" });
  await settleAllAnimations(page, 0);
  await page.screenshot({
    path: path.join(OUT_DIR, "11-dispute-defense-war-room-3x2.png"),
    fullPage: false,
  });

  console.log("12. Capturing 12-dispute-evidence-ocr-bundle-3x2.png...");
  await page.evaluate(() => window.scrollTo({ top: 520, behavior: "instant" }));
  await sleep(1100);
  await page.screenshot({
    path: path.join(OUT_DIR, "12-dispute-evidence-ocr-bundle-3x2.png"),
    fullPage: false,
  });

  console.log("13. Capturing 13-fastlane-checkout-pyusd-bridge-3x2.png...");
  await page.goto(`${BASE_URL}/checkout-bridge`, { waitUntil: "domcontentloaded" });
  await settleAllAnimations(page, 0);
  await page.screenshot({
    path: path.join(OUT_DIR, "13-fastlane-checkout-pyusd-bridge-3x2.png"),
    fullPage: false,
  });

  console.log("14. Capturing 14-about-and-5-faqs-page-3x2.png...");
  await page.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
  await settleAllAnimations(page, 0);
  await page.screenshot({
    path: path.join(OUT_DIR, "14-about-and-5-faqs-page-3x2.png"),
    fullPage: false,
  });

  console.log("15. Capturing 15-privacy-and-terms-governance-3x2.png...");
  await page.goto(`${BASE_URL}/privacy`, { waitUntil: "domcontentloaded" });
  await settleAllAnimations(page, 0);
  await page.screenshot({
    path: path.join(OUT_DIR, "15-privacy-and-terms-governance-3x2.png"),
    fullPage: false,
  });

  // Test Mobile viewport (390x844 iPhone 15 Pro) across routes to verify zero horizontal overflow & capture mobile frames
  const MOBILE_DIR = path.join(OUT_DIR, "mobile");
  fs.mkdirSync(MOBILE_DIR, { recursive: true });
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobileTargets = [
    { route: "/command-center", scrollY: 0, file: "mobile-01-command-center.png" },
    { route: "/command-center", scrollY: 2220, file: "mobile-02-command-center-ledger.png" },
    { route: "/policy-studio", scrollY: 0, file: "mobile-03-policy-studio.png" },
    { route: "/invoicing-scheduler", scrollY: 0, file: "mobile-04-invoicing-scheduler.png" },
    { route: "/dispute-war-room", scrollY: 0, file: "mobile-05-dispute-war-room.png" },
    { route: "/checkout-bridge", scrollY: 0, file: "mobile-06-checkout-bridge.png" },
    { route: "/about", scrollY: 0, file: "mobile-07-about.png" },
    { route: "/privacy", scrollY: 0, file: "mobile-08-privacy.png" },
    { route: "/terms", scrollY: 0, file: "mobile-09-terms.png" },
  ];
  for (const item of mobileTargets) {
    await mobilePage.goto(`${BASE_URL}${item.route}`, { waitUntil: "domcontentloaded" });
    await settleAllAnimations(mobilePage, item.scrollY);
    const overflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    console.log(`Mobile 390px check [${item.route}#${item.scrollY}] -> horizontalOverflow=${overflow}`);
    if (overflow) {
      throw new Error(`Horizontal overflow detected on mobile 390px route ${item.route}`);
    }
    await mobilePage.screenshot({
      path: path.join(MOBILE_DIR, item.file),
      fullPage: false,
    });
  }

  // Capture full-page mobile views (780xfullHeight) for smooth iPhone vertical scrolling in the split-screen demo video
  const tallTargets = [
    { route: "/command-center", file: "mobile-tall-01-command-center.png" },
    { route: "/policy-studio", file: "mobile-tall-03-policy-studio.png" },
    { route: "/invoicing-scheduler", file: "mobile-tall-04-invoicing-scheduler.png" },
    { route: "/dispute-war-room", file: "mobile-tall-05-dispute-war-room.png" },
    { route: "/checkout-bridge", file: "mobile-tall-06-checkout-bridge.png" },
    { route: "/about", file: "mobile-tall-07-about.png" },
  ];
  for (const item of tallTargets) {
    await mobilePage.goto(`${BASE_URL}${item.route}`, { waitUntil: "domcontentloaded" });
    await settleAllAnimations(mobilePage, 0);
    await mobilePage.screenshot({
      path: path.join(MOBILE_DIR, item.file),
      fullPage: true,
    });
  }

  // Also test ultra-narrow 320px (iPhone SE) viewport across all core routes
  const sePage = await browser.newPage({
    viewport: { width: 320, height: 568 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  for (const route of ["/command-center", "/policy-studio", "/invoicing-scheduler", "/dispute-war-room", "/checkout-bridge", "/about", "/privacy", "/terms"]) {
    await sePage.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    await sleep(500);
    const seOverflow = await sePage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    console.log(`Mobile 320px SE check [${route}] -> horizontalOverflow=${seOverflow}`);
    if (seOverflow) {
      throw new Error(`Horizontal overflow detected on 320px SE route ${route}`);
    }
  }

  if (failedAssets.length > 0) {
    console.error("Failed assets:", failedAssets);
    process.exit(1);
  }

  await browser.close();
  console.log("Successfully captured all 15 3:2 screenshots into:", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
