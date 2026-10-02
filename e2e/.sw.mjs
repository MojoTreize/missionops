import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const w of [375, 768, 1024]) { const p = await b.newPage({ viewport: { width: w, height: 800 } });
await p.goto(process.argv[2], { waitUntil: "networkidle" });
console.log(w, await p.evaluate(() => [document.documentElement.scrollWidth, [...document.querySelectorAll("*")].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest("[aria-hidden]") && !e.closest("details:not([open])")).slice(0,5).map(e => e.tagName + "." + e.className.toString().slice(0,60))])); }
await b.close();
