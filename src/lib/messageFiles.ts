import { supabase } from '@/lib/supabase';

const SIGNED_TTL_SECONDS = 60 * 60; // 1 hour
const cache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Resolves a stored attachment reference into a usable URL.
 * New uploads store a private storage path (e.g. "<uid>/123.png") and need a
 * short-lived signed URL. Legacy rows may already contain an absolute URL.
 */
export async function resolveMessageFileUrl(ref: string): Promise<string | null> {
  if (/^https?:\/\//i.test(ref)) return ref;

  const cached = cache.get(ref);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from('message-files')
    .createSignedUrl(ref, SIGNED_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error('Failed to sign attachment URL:', error);
    return null;
  }

  cache.set(ref, {
    url: data.signedUrl,
    expiresAt: Date.now() + (SIGNED_TTL_SECONDS - 60) * 1000,
  });
  return data.signedUrl;
}
