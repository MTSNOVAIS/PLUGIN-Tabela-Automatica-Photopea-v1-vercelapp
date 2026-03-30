import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SOFASCORE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Referer": "https://www.sofascore.com/",
  "Origin": "https://www.sofascore.com",
  "sec-ch-ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
};

router.get("/sofascore", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: "url query param required" });
    return;
  }

  try {
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.includes("sofascore.com") && !parsed.hostname.includes("sofascore.app")) {
      res.status(400).json({ error: "Only sofascore.com allowed" });
      return;
    }

    const response = await fetch(targetUrl, {
      headers: SOFASCORE_HEADERS,
      redirect: "follow",
    });

    const text = await response.text();

    if (!response.ok) {
      req.log.warn({ status: response.status, url: targetUrl }, "Sofascore upstream error");
      res.status(response.status).json({ error: `Sofascore returned ${response.status}`, upstream: text.substring(0, 200) });
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      res.status(502).json({ error: "Invalid JSON from Sofascore" });
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=180");
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Sofascore proxy error");
    res.status(500).json({ error: "Failed to fetch from Sofascore" });
  }
});

export default router;
