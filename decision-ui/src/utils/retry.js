const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 30000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchWithRetry(url, options = {}, retries = 3, timeoutMs = DEFAULT_TIMEOUT_MS) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (resp.status === 401 && !options?.skipAuthRedirect) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.reload();
        throw new Error("Session expired. Please log in again.");
      }
      if (!RETRYABLE_STATUSES.has(resp.status) || attempt === retries) {
        return resp;
      }
      const baseDelay = Math.min(1000 * 2 ** attempt, 8000);
      const jitter = Math.random() * 500;
      clearTimeout(timer);
      await sleep(baseDelay + jitter);
    } catch (err) {
      clearTimeout(timer);
      if (err?.name === "AbortError") {
        throw new Error("Request timed out after " + (timeoutMs / 1000) + "s");
      }
      if (attempt === retries) throw err;
      const baseDelay = Math.min(1000 * 2 ** attempt, 8000);
      const jitter = Math.random() * 500;
      await sleep(baseDelay + jitter);
    }
  }
}
