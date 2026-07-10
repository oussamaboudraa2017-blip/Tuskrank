import { Router, type Request, type Response } from "express";

const router = Router();

const TUSKRANK_API_URL = process.env.TUSKRANK_API_URL;

/**
 * Proxy all /v1/* requests to the upstream TuskRank NestJS API.
 * The upstream base URL is set via the TUSKRANK_API_URL env var.
 * If not configured, returns a 503 with a clear message.
 */
router.all("/v1/*path", async (req: Request, res: Response) => {
  if (!TUSKRANK_API_URL) {
    res.status(503).json({
      success: false,
      error: "API not configured",
      message:
        "Set the TUSKRANK_API_URL secret to the base URL of your TuskRank NestJS API (e.g. https://api.tuskrank.com).",
    });
    return;
  }

  const upstream = `${TUSKRANK_API_URL}/api${req.path}${req.url.includes("?") ? "?" + req.url.split("?")[1] : ""}`;

  try {
    const init: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(req.headers.authorization
          ? { Authorization: req.headers.authorization as string }
          : {}),
      },
    };

    if (!["GET", "HEAD"].includes(req.method) && req.body) {
      init.body = JSON.stringify(req.body);
    }

    const upstream_res = await fetch(upstream, init);
    const body = await upstream_res.json().catch(() => ({}));

    res.status(upstream_res.status).json(body);
  } catch (err) {
    req.log.error({ err, upstream }, "Proxy request failed");
    res.status(502).json({
      success: false,
      error: "Bad Gateway",
      message: "Failed to reach the upstream TuskRank API.",
    });
  }
});

export default router;
