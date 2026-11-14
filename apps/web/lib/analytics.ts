// GA4 via Google Tag Manager ONLY — no direct gtag anywhere in the project.
// GTM ID comes from NEXT_PUBLIC_GTM_ID (env). If it is unset or still the
// placeholder, GTM is not loaded at all.
import type { DataLayerEvent, DataLayerItem, Product } from '@ecommerce/shared';

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? '';
export const isGtmConfigured = (): boolean => Boolean(GTM_ID) && GTM_ID !== 'GTM-XXXXXXX';

// Consent Mode: default is "denied" until the user accepts cookies
// (NEXT_PUBLIC_GA_CONSENT_DEFAULT). The banner flips this to "granted".
export const consentDefault = process.env.NEXT_PUBLIC_GA_CONSENT_DEFAULT ?? 'denied';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushDataLayer(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(event as unknown as Record<string, unknown>);
}

export function productToDataLayerItem(p: Product, quantity = 1): DataLayerItem {
  return {
    item_id: p.sku,
    item_name: p.name,
    price: p.price,
    quantity,
    item_category: p.category,
  };
}

export function trackViewItemList(products: Product[], listName = 'Product list'): void {
  pushDataLayer({ event: 'view_item_list', ecommerce: { item_list_name: listName, items: products.map((p) => productToDataLayerItem(p)) } });
}
export function trackViewItem(p: Product): void {
  pushDataLayer({ event: 'view_item', ecommerce: { currency: 'BDT', value: p.price, items: [productToDataLayerItem(p)] } });
}
export function trackAddToCart(p: Product, quantity = 1): void {
  pushDataLayer({ event: 'add_to_cart', ecommerce: { currency: 'BDT', value: p.price * quantity, items: [productToDataLayerItem(p, quantity)] } });
}
export function trackBeginCheckout(items: DataLayerItem[], value: number): void {
  pushDataLayer({ event: 'begin_checkout', ecommerce: { currency: 'BDT', value, items } });
}
export function trackAddPaymentInfo(items: DataLayerItem[], value: number, paymentType: string): void {
  pushDataLayer({ event: 'add_payment_info', ecommerce: { currency: 'BDT', value, payment_type: paymentType, items } });
}
// Purchase fires ONCE, only after the server confirms the order, and is
// deduped by transaction_id (see checkout/success page).
export function trackPurchase(transactionId: string, value: number, items: DataLayerItem[]): boolean {
  if (typeof window === 'undefined') return false;
  const key = `purchase-fired:${transactionId}`;
  if (window.sessionStorage.getItem(key)) return false;
  window.sessionStorage.setItem(key, '1');
  pushDataLayer({ event: 'purchase', ecommerce: { transaction_id: transactionId, currency: 'BDT', value, items } });
  return true;
}
