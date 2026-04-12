/**
 * payplus-webhook — Supabase Edge Function
 *
 * Receives PayPlus payment notifications and updates the `leads` table.
 *
 * PayPlus sends a HMAC-SHA256 signature in the `X-Payplus-Signature` header
 * using the shared webhook secret. We verify this before touching the DB.
 *
 * Supported events:
 *   charge.success  → set leads.is_paid = true
 *   charge.refund   → set leads.is_paid = false
 *
 * The `more_info` field in the PayPlus payload must contain the Supabase
 * lead UUID so we can correlate the payment to the right row.
 *
 * Returns 500 on DB failure so PayPlus retries the delivery.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('PAYPLUS_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ── HMAC-SHA256 verification ─────────────────────────────────────────────────

async function verifySignature(rawBody: string, signature: string): Promise<boolean> {
  if (!WEBHOOK_SECRET) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  // PayPlus sends the signature as a lowercase hex string
  const sigBytes = Uint8Array.from(
    signature.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) ?? [],
  );
  return crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(rawBody));
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody  = await req.text();
  const signature = req.headers.get('x-payplus-signature') ?? '';

  const valid = await verifySignature(rawBody, signature);
  if (!valid) {
    console.warn('[payplus-webhook] Invalid signature — request rejected');
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const eventType = payload.event as string | undefined;
  const moreInfo  = payload.more_info as string | undefined; // Supabase lead UUID

  if (!moreInfo) {
    console.warn('[payplus-webhook] Missing more_info field — cannot correlate lead');
    return new Response('OK', { status: 200 }); // 200 so PayPlus does not retry
  }

  if (eventType !== 'charge.success' && eventType !== 'charge.refund') {
    // Unknown event — acknowledge so PayPlus stops retrying
    return new Response('OK', { status: 200 });
  }

  const isPaid = eventType === 'charge.success';

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  const { error } = await supabase
    .from('leads')
    .update({ is_paid: isPaid })
    .eq('id', moreInfo);

  if (error) {
    console.error('[payplus-webhook] DB update failed:', error.message);
    // Return 500 — PayPlus will retry
    return new Response('Internal Server Error', { status: 500 });
  }

  console.log(`[payplus-webhook] lead ${moreInfo} → is_paid=${isPaid} (${eventType})`);
  return new Response('OK', { status: 200 });
});
