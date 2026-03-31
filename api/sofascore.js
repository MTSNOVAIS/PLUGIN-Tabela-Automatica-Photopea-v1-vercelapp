const ALLOWED_HOSTS = [
  "site.api.espn.com",
  "www.sofascore.com",
  "sofascore.com",
];

const PROXY_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "url query param required" });
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!ALLOWED_HOSTS.some((h) => parsed.hostname.includes(h))) {
    return res.status(400).json({ error: "Host not allowed" });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: PROXY_HEADERS,
      redirect: "follow",
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: `API returned ${response.status}`,
        detail: text.substring(0, 300),
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "Invalid JSON from upstream" });
    }

    res.setHeader("Cache-Control", "public, max-age=120");
    return res.json(data);
  } catch {
    return res.status(500).json({ error: "Failed to fetch from upstream" });
  }
};
