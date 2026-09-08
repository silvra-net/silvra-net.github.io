import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
mkdirSync("look", { recursive: true });
const b = await chromium.launch({ channel: "chromium" });
for (const theme of ["dark", "light"]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
  const p = await ctx.newPage();
  for (const [name, url] of [["privacy", "https://silvra.net/privacy/"], ["explorer", "https://explorer.silvra.net/"]]) {
    await p.goto(url, { waitUntil: "load" });
    await p.waitForTimeout(4000);
    await p.screenshot({ path: `look/${theme}-${name}.png`, fullPage: name === "privacy" });
  }
  await ctx.close();
}
await b.close();
console.log("ok");
