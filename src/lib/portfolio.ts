/** Shared portfolio constants + a safe data-URL parser (server-side). */

/** Cap on a single image after the client resizes it. */
export const PORTFOLIO_MAX_BYTES = 6_000_000; // ~6 MB

export const PORTFOLIO_ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export type PortfolioMime = (typeof PORTFOLIO_ALLOWED_MIME)[number];

export type ParsedImage = { mimeType: PortfolioMime; buffer: Buffer };

/**
 * Validate + decode a `data:image/...;base64,...` URL. Returns null for
 * anything that isn't an allowed image or is empty / too large.
 */
export function parseImageDataUrl(dataUrl: unknown): ParsedImage | null {
  if (typeof dataUrl !== "string") return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!match) return null;

  const mimeType = match[1] as PortfolioMime;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(match[2], "base64");
  } catch {
    return null;
  }
  if (buffer.length === 0 || buffer.length > PORTFOLIO_MAX_BYTES) return null;

  return { mimeType, buffer };
}
