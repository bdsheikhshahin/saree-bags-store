// Bangladesh payment integrations — sandbox/test mode only.
// No real money moves here unless real merchant credentials are put in .env
// and the sandbox flags are switched off. Every provider is env-driven:
// with no credentials configured, initiatePayment returns
// { configured: false, note } and NEVER calls a gateway.
// Stripe is intentionally NOT used (not available to Bangladesh merchants).
import { createHash, createSign, publicEncrypt, randomBytes, constants as cryptoConstants } from 'node:crypto';
import type { PaymentMethod } from '@ecommerce/shared';
import { env } from '../config/env';

export interface PaymentCustomer {
  name: string;
  email?: string;
  phone: string;
  address?: string;
}

export interface PaymentInitOptions {
  successUrl?: string;
  failUrl?: string;
  cancelUrl?: string;
  ipnUrl?: string;
  customer?: PaymentCustomer;
}

export interface PaymentInitResult {
  provider: PaymentMethod;
  /** True when a real gateway call was made and a redirect URL is available. */
  configured: boolean;
  redirectUrl?: string;
  reference: string;
  note: string;
}

function reference(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function callbackBase(): string {
  return `${env.webUrl.replace(/\/$/, '')}/api/payments`;
}

export function isSslCommerzConfigured(): boolean {
  return Boolean(env.sslcommerz.storeId && env.sslcommerz.storePassword);
}
export function isBkashConfigured(): boolean {
  return Boolean(env.bkash.appKey && env.bkash.appSecret && env.bkash.username && env.bkash.password);
}
export function isNagadConfigured(): boolean {
  return Boolean(env.nagad.merchantId && env.nagad.publicKey && env.nagad.privateKey);
}
export function isProviderConfigured(provider: PaymentMethod): boolean {
  switch (provider) {
    case 'sslcommerz': return isSslCommerzConfigured();
    case 'bkash': return isBkashConfigured();
    case 'nagad': return isNagadConfigured();
    case 'cod': return true;
  }
}

async function postJson<T>(url: string, body: unknown, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let data: unknown = null;
  try { data = JSON.parse(text); } catch { /* gateway returned non-JSON */ }
  if (!res.ok) throw new Error(`Gateway request failed (${res.status}): ${text.slice(0, 300)}`);
  return data as T;
}

async function postForm<T>(url: string, fields: Record<string, string>): Promise<T> {
  const body = new URLSearchParams(fields);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = JSON.parse(text); } catch { /* gateway returned non-JSON */ }
  if (!res.ok) throw new Error(`Gateway request failed (${res.status}): ${text.slice(0, 300)}`);
  return data as T;
}

// ---------------------------------------------------------------------------
// SSLCommerz
// Docs: init POSTs a form to /gwprocess/v4/api.php and returns GatewayPageURL;
// the success/fail/IPN callbacks carry val_id, which must be checked against
// the validation server before trusting the payment.
// ---------------------------------------------------------------------------
export async function initiateSslCommerz(
  orderId: string,
  amountBdt: number,
  opts: PaymentInitOptions = {},
): Promise<PaymentInitResult> {
  if (!isSslCommerzConfigured()) {
    return {
      provider: 'sslcommerz', configured: false, reference: reference('SSL'),
      note: 'SSLCommerz sandbox credentials are not configured — set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD in apps/api/.env (sandbox test credentials from the SSLCommerz store panel).',
    };
  }
  const base = callbackBase();
  const customer = opts.customer;
  const data = await postForm<{ status?: string; GatewayPageURL?: string; failedreason?: string }>(env.sslcommerz.initUrl, {
    store_id: env.sslcommerz.storeId,
    store_passwd: env.sslcommerz.storePassword,
    total_amount: String(amountBdt),
    currency: 'BDT',
    tran_id: orderId,
    success_url: opts.successUrl ?? `${base}/sslcommerz/success`,
    fail_url: opts.failUrl ?? `${base}/sslcommerz/fail`,
    cancel_url: opts.cancelUrl ?? `${base}/sslcommerz/cancel`,
    ipn_url: opts.ipnUrl ?? `${base}/sslcommerz/ipn`,
    cus_name: customer?.name ?? 'Customer',
    cus_email: customer?.email ?? 'customer@example.com',
    cus_phone: customer?.phone ?? '01XXXXXXXXX',
    cus_add1: customer?.address ?? 'Dhaka, Bangladesh',
    cus_country: 'Bangladesh',
    product_name: `Order ${orderId}`,
    product_category: 'General',
    product_profile: 'general',
    shipping_method: 'Courier',
    num_of_item: '1',
  });
  if (data.status !== 'SUCCESS' || !data.GatewayPageURL) {
    throw new Error(`SSLCommerz init failed: ${data.failedreason ?? data.status ?? 'unknown error'}`);
  }
  return { provider: 'sslcommerz', configured: true, redirectUrl: data.GatewayPageURL, reference: orderId, note: 'Redirect the shopper to the SSLCommerz gateway page.' };
}

export interface SslValidation {
  valid: boolean;
  status: string;
  tranId?: string;
  amount?: number;
  raw: unknown;
}

export async function validateSslCommerz(valId: string): Promise<SslValidation> {
  const url = `${env.sslcommerz.validationUrl}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(env.sslcommerz.storeId)}&store_passwd=${encodeURIComponent(env.sslcommerz.storePassword)}&format=json`;
  const res = await fetch(url);
  const data = (await res.json().catch(() => null)) as { status?: string; tran_id?: string; amount?: string } | null;
  if (!res.ok || !data) throw new Error(`SSLCommerz validation request failed (${res.status})`);
  const status = data.status ?? 'INVALID';
  return {
    valid: status === 'VALID' || status === 'VALIDATED',
    status,
    tranId: data.tran_id,
    amount: data.amount ? Number(data.amount) : undefined,
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// bKash (tokenized checkout v1.2.0-beta)
// Flow: grant token -> create payment (returns bkashURL) -> shopper pays ->
// callback with paymentID -> execute payment -> transactionStatus Completed.
// ---------------------------------------------------------------------------
interface BkashTokenResponse { id_token?: string; token_type?: string; expires_in?: number; statusCode?: string; statusMessage?: string }

async function bkashGrantToken(): Promise<string> {
  const data = await postJson<BkashTokenResponse>(
    `${env.bkash.baseUrl}/tokenized/checkout/token/grant`,
    { app_key: env.bkash.appKey, app_secret: env.bkash.appSecret },
    { 'Content-Type': 'application/json', username: env.bkash.username, password: env.bkash.password },
  );
  if (!data.id_token) throw new Error(`bKash token grant failed: ${data.statusMessage ?? 'no id_token returned'}`);
  return data.id_token;
}

function bkashHeaders(idToken: string): Record<string, string> {
  return { 'Content-Type': 'application/json', Authorization: idToken, 'X-APP-Key': env.bkash.appKey };
}

export async function initiateBkash(
  orderId: string,
  amountBdt: number,
  opts: PaymentInitOptions = {},
): Promise<PaymentInitResult> {
  if (!isBkashConfigured()) {
    return {
      provider: 'bkash', configured: false, reference: reference('BKH'),
      note: 'bKash sandbox credentials are not configured — set BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME and BKASH_PASSWORD in apps/api/.env (sandbox credentials from the bKash developer portal).',
    };
  }
  const idToken = await bkashGrantToken();
  const data = await postJson<{ paymentID?: string; bkashURL?: string; statusCode?: string; statusMessage?: string }>(
    `${env.bkash.baseUrl}/tokenized/checkout/create`,
    {
      mode: '0011',
      payerReference: opts.customer?.phone ?? orderId,
      callbackURL: opts.successUrl ?? `${callbackBase()}/bkash/callback`,
      amount: String(amountBdt),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: orderId,
    },
    bkashHeaders(idToken),
  );
  if (!data.paymentID || !data.bkashURL) {
    throw new Error(`bKash create payment failed: ${data.statusMessage ?? data.statusCode ?? 'unknown error'}`);
  }
  return { provider: 'bkash', configured: true, redirectUrl: data.bkashURL, reference: data.paymentID, note: 'Redirect the shopper to the bKash payment page.' };
}

export interface BkashExecution {
  executed: boolean;
  transactionStatus?: string;
  trxID?: string;
  paymentID?: string;
  amount?: number;
  raw: unknown;
}

export async function executeBkashPayment(paymentID: string): Promise<BkashExecution> {
  const idToken = await bkashGrantToken();
  const data = await postJson<{ transactionStatus?: string; trxID?: string; paymentID?: string; amount?: string; statusCode?: string; statusMessage?: string }>(
    `${env.bkash.baseUrl}/tokenized/checkout/execute`,
    { paymentID },
    bkashHeaders(idToken),
  );
  return {
    executed: data.transactionStatus === 'Completed',
    transactionStatus: data.transactionStatus,
    trxID: data.trxID,
    paymentID: data.paymentID,
    amount: data.amount ? Number(data.amount) : undefined,
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Nagad (remote payment gateway, checkout initialize + verify)
// The sensitive payload is RSA-encrypted with Nagad's public key and signed
// with the merchant private key (SHA256withRSA), per Nagad's published flow.
// With placeholder/invalid keys the crypto step throws and the caller gets a
// clear error instead of a half-formed gateway request.
// ---------------------------------------------------------------------------
function nagadDateTime(): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function normalizePem(key: string, label: string): string {
  const compact = key.replace(/\\n/g, '\n').trim();
  if (compact.includes('BEGIN')) return compact;
  // Raw base64 key material: wrap it in a PEM block.
  const body = compact.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') ?? compact;
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}

export async function initiateNagad(
  orderId: string,
  amountBdt: number,
  opts: PaymentInitOptions = {},
): Promise<PaymentInitResult> {
  if (!isNagadConfigured()) {
    return {
      provider: 'nagad', configured: false, reference: reference('NGD'),
      note: 'Nagad sandbox credentials are not configured — set NAGAD_MERCHANT_ID, NAGAD_PUBLIC_KEY and NAGAD_PRIVATE_KEY in apps/api/.env (sandbox credentials from the Nagad merchant panel).',
    };
  }
  const dateTime = nagadDateTime();
  const challenge = randomBytes(20).toString('hex'); // 40 hex chars
  const sensitiveData = { merchantId: env.nagad.merchantId, datetime: dateTime, orderId, challenge };
  let encrypted: string;
  let signature: string;
  try {
    const publicKey = normalizePem(env.nagad.publicKey, 'PUBLIC KEY');
    encrypted = publicEncrypt(
      { key: publicKey, padding: cryptoConstants.RSA_PKCS1_PADDING },
      Buffer.from(JSON.stringify(sensitiveData)),
    ).toString('base64');
    const privateKey = normalizePem(env.nagad.privateKey, 'PRIVATE KEY');
    const signer = createSign('SHA256');
    signer.update(JSON.stringify(sensitiveData));
    signature = signer.sign(privateKey, 'base64');
  } catch (err) {
    throw new Error(`Nagad key error — check NAGAD_PUBLIC_KEY / NAGAD_PRIVATE_KEY in .env: ${err instanceof Error ? err.message : String(err)}`);
  }
  const data = await postJson<{ callBackUrl?: string; sensitiveData?: string; signature?: string; status?: string; message?: string; reason?: string }>(
    `${env.nagad.baseUrl}/check-out/initialize/${encodeURIComponent(env.nagad.merchantId)}/${encodeURIComponent(orderId)}`,
    {
      accountNumber: env.nagad.merchantId,
      dateTime,
      sensitiveData: encrypted,
      signature,
      merchantCallbackURL: opts.successUrl ?? `${callbackBase()}/nagad/callback`,
      additionalMerchantInfo: { orderId, amount: String(amountBdt) },
    },
    { 'Content-Type': 'application/json', 'X-KM-Api-Version': 'v-0.2.0', 'X-KM-Client-Type': 'PC_WEB', 'X-KM-IP-V4': '127.0.0.1' },
  );
  if (!data.callBackUrl) {
    throw new Error(`Nagad init failed: ${data.message ?? data.reason ?? data.status ?? 'no callBackUrl returned'}`);
  }
  return { provider: 'nagad', configured: true, redirectUrl: data.callBackUrl, reference: orderId, note: 'Redirect the shopper to the Nagad checkout page.' };
}

export interface NagadVerification {
  verified: boolean;
  status?: string;
  paymentRefId?: string;
  amount?: number;
  raw: unknown;
}

export async function verifyNagadPayment(paymentRefId: string): Promise<NagadVerification> {
  const res = await fetch(`${env.nagad.baseUrl}/verify/payment/${encodeURIComponent(paymentRefId)}`, {
    headers: { 'X-KM-Api-Version': 'v-0.2.0', 'X-KM-Client-Type': 'PC_WEB' },
  });
  const data = (await res.json().catch(() => null)) as { status?: string; paymentRefId?: string; amount?: string; merchantId?: string } | null;
  if (!res.ok || !data) throw new Error(`Nagad verify request failed (${res.status})`);
  const status = data.status ?? '';
  return { verified: status === 'Success', status, paymentRefId: data.paymentRefId, amount: data.amount ? Number(data.amount) : undefined, raw: data };
}

/** Deterministic reference for Nagad callbacks (paymentRefId arrives from the gateway). */
export function nagadReference(paymentRefId: string): string {
  return createHash('sha256').update(paymentRefId).digest('hex').slice(0, 16);
}

// ---------------------------------------------------------------------------
// Unified entry point (used by the payments route + order creation).
// Never throws for missing credentials — returns configured: false instead.
// ---------------------------------------------------------------------------
export async function initiatePayment(
  method: PaymentMethod,
  orderId: string,
  amountBdt: number,
  opts: PaymentInitOptions = {},
): Promise<PaymentInitResult> {
  switch (method) {
    case 'sslcommerz':
      return initiateSslCommerz(orderId, amountBdt, opts);
    case 'bkash':
      return initiateBkash(orderId, amountBdt, opts);
    case 'nagad':
      return initiateNagad(orderId, amountBdt, opts);
    case 'cod':
      return { provider: method, configured: true, reference: reference('COD'), note: `Cash on Delivery — no online payment. Collect ৳${amountBdt} on delivery for order ${orderId}.` };
    default:
      throw new Error(`Unsupported payment method: ${String(method)}`);
  }
}
