import { chromium } from "@playwright/test";
const [,, url, out, w, full] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 900 }, deviceScaleFactor: 1 });
await p.goto(url, { waitUntil: "networkidle" });
await p.screenshot({ path: out, fullPage: full === "1" });
await b.close();
