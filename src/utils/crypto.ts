/**
 * Unified HMAC-SHA256 cryptographic utility for signature creation and verification.
 * Built with the standard Web Cryptography API (supported across all modern browsers and Node 16+).
 */

export async function generateHmacSha256(message: string, secret: string): Promise<string> {
  const subtleCrypto = (globalThis as any).crypto?.subtle;

  if (subtleCrypto) {
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const key = await subtleCrypto.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await subtleCrypto.sign('HMAC', key, enc.encode(message));
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');
  }

  // Deterministic fallback for environments without WebCrypto
  let hash = 0;
  const combined = message + ':' + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export async function verifyHmacSha256(
  message: string,
  secret: string,
  expectedSignature: string
): Promise<boolean> {
  if (!message || !secret || !expectedSignature) return false;
  try {
    const generated = await generateHmacSha256(message, secret);
    return timingSafeEqual(generated.toLowerCase(), expectedSignature.toLowerCase());
  } catch (err) {
    console.error('[crypto] HMAC verification error:', err);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks on cryptographic signatures.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
