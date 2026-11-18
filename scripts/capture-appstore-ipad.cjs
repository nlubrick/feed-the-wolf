"use strict";
const fs = require("node:fs");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage({
      viewport: { width: 1032, height: 1376 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      colorScheme: "dark",
    });
    page.on("pageerror", e => console.log("PAGE ERROR:", e.message));
    await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(5000);
    const status = await page.evaluate(() => ({
      game: document.querySelector("#game")?.getBoundingClientRect().toJSON(),
      hidden: document.querySelector("#game")?.hidden,
      hasShow: typeof window.show === "function",
      title: document.title,
      intro: window.__feStudioIntroActive,
      bodyText: document.body.innerText.slice(0, 150)
    }));
    console.log("STATUS", JSON.stringify(status));
    await page.evaluate(() => {
      // Gameplay is already the initial screen; dismiss the optional cinematic
      // only to take a clear, truthful screenshot of the actual game UI.
      if (typeof window.show === "function") window.show("game");
    });
    await page.waitForTimeout(500);
    fs.mkdirSync("appstore-screenshots", { recursive: true });
    await page.screenshot({ path: "appstore-screenshots/feed-the-wolf-ipad-13-game.png", animations: "disabled" });
    await page.evaluate(() => { if (typeof window.show === "function") window.show("shop"); });
    await page.waitForTimeout(500);
    await page.screenshot({ path: "appstore-screenshots/feed-the-wolf-ipad-13-store.png", animations: "disabled" });
    console.log("Captured exact 2064 x 2752 display resolution screenshots.");
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exit(1); });
