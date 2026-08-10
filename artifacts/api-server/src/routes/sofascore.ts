import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ALLOWED_HOSTS = [
  "site.api.espn.com",
  "site.web.api.espn.com",
  "www.thesportsdb.com",
  "thesportsdb.com",
];

const ESPN_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

const THESPORTSDB_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
};

router.get("/sofascore", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: "url query param required" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  if (!ALLOWED_HOSTS.some(h => parsed.hostname.includes(h))) {
    res.status(400).json({ error: "Host not allowed" });
    return;
  }

  const requestHeaders = parsed.hostname.includes("thesportsdb") 
    ? THESPORTSDB_HEADERS 
    : ESPN_HEADERS;

  try {
    const response = await fetch(targetUrl, {
      headers: requestHeaders,
      redirect: "follow",
    });

    const text = await response.text();

    if (!response.ok) {
      if (req.log && typeof req.log.warn === "function") {
        req.log.warn({ status: response.status, url: targetUrl }, "Upstream API error");
      }
      res.status(response.status).json({ 
        error: `API returned ${response.status}`, 
        detail: text.substring(0, 300) 
      });
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      res.status(502).json({ error: "Invalid JSON from upstream" });
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=120");
    res.json(data);
  } catch (err) {
    if (req.log && typeof req.log.error === "function") {
      req.log.error({ err }, "Proxy fetch error");
    }
    res.status(500).json({ error: "Failed to fetch from upstream" });
  }
});

export default router;
