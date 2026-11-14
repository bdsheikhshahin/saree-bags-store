"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSslCommerzConfigured = isSslCommerzConfigured;
exports.isBkashConfigured = isBkashConfigured;
exports.isNagadConfigured = isNagadConfigured;
exports.isProviderConfigured = isProviderConfigured;
exports.initiateSslCommerz = initiateSslCommerz;
exports.validateSslCommerz = validateSslCommerz;
exports.initiateBkash = initiateBkash;
exports.executeBkashPayment = executeBkashPayment;
exports.initiateNagad = initiateNagad;
exports.verifyNagadPayment = verifyNagadPayment;
exports.nagadReference = nagadReference;
exports.initiatePayment = initiatePayment;
// Bangladesh payment integrations — sandbox/test mode only.
// No real money moves here unless real merchant credentials are put in .env
// and the sandbox flags are switched off. Every provider is env-driven:
// with no credentials configured, initiatePayment returns
// { configured: false, note } and NEVER calls a gateway.
// Stripe is intentionally NOT used (not available to Bangladesh merchants).
const node_crypto_1 = require("node:crypto");
const env_1 = require("../config/env");
function reference(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}
function callbackBase() {
    return `${env_1.env.webUrl.replace(/\/$/, '')}/api/payments`;
}
function isSslCommerzConfigured() {
    return Boolean(env_1.env.sslcommerz.storeId && env_1.env.sslcommerz.storePassword);
}
function isBkashConfigured() {
    return Boolean(env_1.env.bkash.appKey && env_1.env.bkash.appSecret && env_1.env.bkash.username && env_1.env.bkash.password);
}
function isNagadConfigured() {
    return Boolean(env_1.env.nagad.merchantId && env_1.env.nagad.publicKey && env_1.env.nagad.privateKey);
}
function isProviderConfigured(provider) {
    switch (provider) {
        case 'sslcommerz': return isSslCommerzConfigured();
        case 'bkash': return isBkashConfigured();
        case 'nagad': return isNagadConfigured();
        case 'cod': return true;
    }
}
async function postJson(url, body, headers) {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await res.text();
    let data = null;
    try {
        data = JSON.parse(text);
    }
    catch { /* gateway returned non-JSON */ }
    if (!res.ok)
        throw new Error(`Gateway request failed (${res.status}): ${text.slice(0, 300)}`);
    return data;
}
async function postForm(url, fields) {
    const body = new URLSearchParams(fields);
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    const text = await res.text();
    let data = null;
    try {
        data = JSON.parse(text);
    }
    catch { /* gateway returned non-JSON */ }
    if (!res.ok)
        throw new Error(`Gateway request failed (${res.status}): ${text.slice(0, 300)}`);
    return data;
}
// ---------------------------------------------------------------------------
// SSLCommerz
// Docs: init POSTs a form to /gwprocess/v4/api.php and returns GatewayPageURL;
// the success/fail/IPN callbacks carry val_id, which must be checked against
// the validation server before trusting the payment.
// ---------------------------------------------------------------------------
async function initiateSslCommerz(orderId, amountBdt, opts = {}) {
    if (!isSslCommerzConfigured()) {
        return {
            provider: 'sslcommerz', configured: false, reference: reference('SSL'),
            note: 'SSLCommerz sandbox credentials are not configured — set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD in apps/api/.env (sandbox test credentials from the SSLCommerz store panel).',
        };
    }
    const base = callbackBase();
    const customer = opts.customer;
    const data = await postForm(env_1.env.sslcommerz.initUrl, {
        store_id: env_1.env.sslcommerz.storeId,
        store_passwd: env_1.env.sslcommerz.storePassword,
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
async function validateSslCommerz(valId) {
    const url = `${env_1.env.sslcommerz.validationUrl}?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(env_1.env.sslcommerz.storeId)}&store_passwd=${encodeURIComponent(env_1.env.sslcommerz.storePassword)}&format=json`;
    const res = await fetch(url);
    const data = (await res.json().catch(() => null));
    if (!res.ok || !data)
        throw new Error(`SSLCommerz validation request failed (${res.status})`);
    const status = data.status ?? 'INVALID';
    return {
        valid: status === 'VALID' || status === 'VALIDATED',
        status,
        tranId: data.tran_id,
        amount: data.amount ? Number(data.amount) : undefined,
        raw: data,
    };
}
async function bkashGrantToken() {
    const data = await postJson(`${env_1.env.bkash.baseUrl}/tokenized/checkout/token/grant`, { app_key: env_1.env.bkash.appKey, app_secret: env_1.env.bkash.appSecret }, { 'Content-Type': 'application/json', username: env_1.env.bkash.username, password: env_1.env.bkash.password });
    if (!data.id_token)
        throw new Error(`bKash token grant failed: ${data.statusMessage ?? 'no id_token returned'}`);
    return data.id_token;
}
function bkashHeaders(idToken) {
    return { 'Content-Type': 'application/json', Authorization: idToken, 'X-APP-Key': env_1.env.bkash.appKey };
}
async function initiateBkash(orderId, amountBdt, opts = {}) {
    if (!isBkashConfigured()) {
        return {
            provider: 'bkash', configured: false, reference: reference('BKH'),
            note: 'bKash sandbox credentials are not configured — set BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME and BKASH_PASSWORD in apps/api/.env (sandbox credentials from the bKash developer portal).',
        };
    }
    const idToken = await bkashGrantToken();
    const data = await postJson(`${env_1.env.bkash.baseUrl}/tokenized/checkout/create`, {
        mode: '0011',
        payerReference: opts.customer?.phone ?? orderId,
        callbackURL: opts.successUrl ?? `${callbackBase()}/bkash/callback`,
        amount: String(amountBdt),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: orderId,
    }, bkashHeaders(idToken));
    if (!data.paymentID || !data.bkashURL) {
        throw new Error(`bKash create payment failed: ${data.statusMessage ?? data.statusCode ?? 'unknown error'}`);
    }
    return { provider: 'bkash', configured: true, redirectUrl: data.bkashURL, reference: data.paymentID, note: 'Redirect the shopper to the bKash payment page.' };
}
async function executeBkashPayment(paymentID) {
    const idToken = await bkashGrantToken();
    const data = await postJson(`${env_1.env.bkash.baseUrl}/tokenized/checkout/execute`, { paymentID }, bkashHeaders(idToken));
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
function nagadDateTime() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}
function normalizePem(key, label) {
    const compact = key.replace(/\\n/g, '\n').trim();
    if (compact.includes('BEGIN'))
        return compact;
    // Raw base64 key material: wrap it in a PEM block.
    const body = compact.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') ?? compact;
    return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`;
}
async function initiateNagad(orderId, amountBdt, opts = {}) {
    if (!isNagadConfigured()) {
        return {
            provider: 'nagad', configured: false, reference: reference('NGD'),
            note: 'Nagad sandbox credentials are not configured — set NAGAD_MERCHANT_ID, NAGAD_PUBLIC_KEY and NAGAD_PRIVATE_KEY in apps/api/.env (sandbox credentials from the Nagad merchant panel).',
        };
    }
    const dateTime = nagadDateTime();
    const challenge = (0, node_crypto_1.randomBytes)(20).toString('hex'); // 40 hex chars
    const sensitiveData = { merchantId: env_1.env.nagad.merchantId, datetime: dateTime, orderId, challenge };
    let encrypted;
    let signature;
    try {
        const publicKey = normalizePem(env_1.env.nagad.publicKey, 'PUBLIC KEY');
        encrypted = (0, node_crypto_1.publicEncrypt)({ key: publicKey, padding: node_crypto_1.constants.RSA_PKCS1_PADDING }, Buffer.from(JSON.stringify(sensitiveData))).toString('base64');
        const privateKey = normalizePem(env_1.env.nagad.privateKey, 'PRIVATE KEY');
        const signer = (0, node_crypto_1.createSign)('SHA256');
        signer.update(JSON.stringify(sensitiveData));
        signature = signer.sign(privateKey, 'base64');
    }
    catch (err) {
        throw new Error(`Nagad key error — check NAGAD_PUBLIC_KEY / NAGAD_PRIVATE_KEY in .env: ${err instanceof Error ? err.message : String(err)}`);
    }
    const data = await postJson(`${env_1.env.nagad.baseUrl}/check-out/initialize/${encodeURIComponent(env_1.env.nagad.merchantId)}/${encodeURIComponent(orderId)}`, {
        accountNumber: env_1.env.nagad.merchantId,
        dateTime,
        sensitiveData: encrypted,
        signature,
        merchantCallbackURL: opts.successUrl ?? `${callbackBase()}/nagad/callback`,
        additionalMerchantInfo: { orderId, amount: String(amountBdt) },
    }, { 'Content-Type': 'application/json', 'X-KM-Api-Version': 'v-0.2.0', 'X-KM-Client-Type': 'PC_WEB', 'X-KM-IP-V4': '127.0.0.1' });
    if (!data.callBackUrl) {
        throw new Error(`Nagad init failed: ${data.message ?? data.reason ?? data.status ?? 'no callBackUrl returned'}`);
    }
    return { provider: 'nagad', configured: true, redirectUrl: data.callBackUrl, reference: orderId, note: 'Redirect the shopper to the Nagad checkout page.' };
}
async function verifyNagadPayment(paymentRefId) {
    const res = await fetch(`${env_1.env.nagad.baseUrl}/verify/payment/${encodeURIComponent(paymentRefId)}`, {
        headers: { 'X-KM-Api-Version': 'v-0.2.0', 'X-KM-Client-Type': 'PC_WEB' },
    });
    const data = (await res.json().catch(() => null));
    if (!res.ok || !data)
        throw new Error(`Nagad verify request failed (${res.status})`);
    const status = data.status ?? '';
    return { verified: status === 'Success', status, paymentRefId: data.paymentRefId, amount: data.amount ? Number(data.amount) : undefined, raw: data };
}
/** Deterministic reference for Nagad callbacks (paymentRefId arrives from the gateway). */
function nagadReference(paymentRefId) {
    return (0, node_crypto_1.createHash)('sha256').update(paymentRefId).digest('hex').slice(0, 16);
}
// ---------------------------------------------------------------------------
// Unified entry point (used by the payments route + order creation).
// Never throws for missing credentials — returns configured: false instead.
// ---------------------------------------------------------------------------
async function initiatePayment(method, orderId, amountBdt, opts = {}) {
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
//# sourceMappingURL=payments.js.map