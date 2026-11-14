import type { PaymentMethod } from '@ecommerce/shared';
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
export declare function isSslCommerzConfigured(): boolean;
export declare function isBkashConfigured(): boolean;
export declare function isNagadConfigured(): boolean;
export declare function isProviderConfigured(provider: PaymentMethod): boolean;
export declare function initiateSslCommerz(orderId: string, amountBdt: number, opts?: PaymentInitOptions): Promise<PaymentInitResult>;
export interface SslValidation {
    valid: boolean;
    status: string;
    tranId?: string;
    amount?: number;
    raw: unknown;
}
export declare function validateSslCommerz(valId: string): Promise<SslValidation>;
export declare function initiateBkash(orderId: string, amountBdt: number, opts?: PaymentInitOptions): Promise<PaymentInitResult>;
export interface BkashExecution {
    executed: boolean;
    transactionStatus?: string;
    trxID?: string;
    paymentID?: string;
    amount?: number;
    raw: unknown;
}
export declare function executeBkashPayment(paymentID: string): Promise<BkashExecution>;
export declare function initiateNagad(orderId: string, amountBdt: number, opts?: PaymentInitOptions): Promise<PaymentInitResult>;
export interface NagadVerification {
    verified: boolean;
    status?: string;
    paymentRefId?: string;
    amount?: number;
    raw: unknown;
}
export declare function verifyNagadPayment(paymentRefId: string): Promise<NagadVerification>;
/** Deterministic reference for Nagad callbacks (paymentRefId arrives from the gateway). */
export declare function nagadReference(paymentRefId: string): string;
export declare function initiatePayment(method: PaymentMethod, orderId: string, amountBdt: number, opts?: PaymentInitOptions): Promise<PaymentInitResult>;
//# sourceMappingURL=payments.d.ts.map