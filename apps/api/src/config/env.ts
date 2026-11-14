import 'dotenv/config';

const SSLCOMMERZ_SANDBOX_INIT = 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';
const SSLCOMMERZ_LIVE_INIT = 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';
const SSLCOMMERZ_SANDBOX_VALIDATION = 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';
const SSLCOMMERZ_LIVE_VALIDATION = 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';
const BKASH_SANDBOX_BASE = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';
const BKASH_LIVE_BASE = 'https://tokenized.pay.bka.sh/v1.2.0-beta';
const NAGAD_SANDBOX_BASE = 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs';
const NAGAD_LIVE_BASE = 'https://api.mynagad.com/api/dfs';

const sslSandbox = process.env.SSLCOMMERZ_SANDBOX !== 'false';
const bkashSandbox = process.env.BKASH_SANDBOX !== 'false';
const nagadSandbox = process.env.NAGAD_SANDBOX !== 'false';

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/ecommerce',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-to-a-long-random-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  // Public storefront URL — payment gateways redirect the shopper back here.
  webUrl: process.env.WEB_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  sslcommerz: {
    storeId: process.env.SSLCOMMERZ_STORE_ID ?? '',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD ?? '',
    // Sandbox is the default. Set SSLCOMMERZ_SANDBOX=false for live.
    sandbox: sslSandbox,
    isLive: process.env.SSLCOMMERZ_IS_LIVE === 'true' || !sslSandbox,
    initUrl: process.env.SSLCOMMERZ_INIT_URL ?? (sslSandbox ? SSLCOMMERZ_SANDBOX_INIT : SSLCOMMERZ_LIVE_INIT),
    validationUrl:
      process.env.SSLCOMMERZ_VALIDATION_URL ?? (sslSandbox ? SSLCOMMERZ_SANDBOX_VALIDATION : SSLCOMMERZ_LIVE_VALIDATION),
  },
  bkash: {
    appKey: process.env.BKASH_APP_KEY ?? '',
    appSecret: process.env.BKASH_APP_SECRET ?? '',
    username: process.env.BKASH_USERNAME ?? '',
    password: process.env.BKASH_PASSWORD ?? '',
    sandbox: bkashSandbox,
    baseUrl: process.env.BKASH_BASE_URL ?? (bkashSandbox ? BKASH_SANDBOX_BASE : BKASH_LIVE_BASE),
  },
  nagad: {
    merchantId: process.env.NAGAD_MERCHANT_ID ?? '',
    publicKey: process.env.NAGAD_PUBLIC_KEY ?? '',
    privateKey: process.env.NAGAD_PRIVATE_KEY ?? '',
    sandbox: nagadSandbox,
    baseUrl: process.env.NAGAD_BASE_URL ?? (nagadSandbox ? NAGAD_SANDBOX_BASE : NAGAD_LIVE_BASE),
  },
};
