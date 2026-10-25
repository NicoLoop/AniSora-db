export const VIDNEST_ENC_KEY = 'K3p8vQ2mX9rL5wZ0fN7bG1sH4tJ6dC9_y8S3wM1nQ5pL2';
export const VIDNEST_API_BASE = 'https://new.vidnest.fun';
export const VIDNEST_PROXY_BASE = 'https://upcloud.animanga.fun';

export function generateStreamNonce(): string {
  const nonceBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(nonceBytes);
  let binary = '';
  for (let i = 0; i < nonceBytes.length; i++) {
    binary += String.fromCharCode(nonceBytes[i]);
  }
  return Buffer.from(binary, 'binary')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function buildProxyUrl(
  streamUrl: string,
  headers: Record<string, string>
): string {
  if (!streamUrl) return '';
  const params = new URLSearchParams();
  params.set('url', streamUrl);
  params.set('headers', JSON.stringify(headers));
  return `${VIDNEST_PROXY_BASE}/proxy?${params.toString()}`;
}

export async function decryptVidNestCipher(
  ciphertext: string,
  nonce: string
): Promise<any> {
  const enc = new TextEncoder().encode(`${nonce}|${VIDNEST_ENC_KEY}`);
  const hash = await globalThis.crypto.subtle.digest('SHA-256', enc);
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    hash,
    'AES-GCM',
    false,
    ['decrypt']
  );

  let b64 = ciphertext.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  const buf = Buffer.from(b64, 'base64');
  const bytes = new Uint8Array(buf);

  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);

  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  const decoded = new TextDecoder().decode(decrypted);

  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}
