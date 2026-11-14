// Client-side cart with server sync.
// Guests: cart lives in localStorage only.
// Logged-in customers (a JWT in localStorage under CUSTOMER_TOKEN_KEY — set
// by the customer login flow): the cart syncs to the DB via /api/cart, the
// guest cart is merged into the DB cart on login, and the server cart wins
// when it loads. The API being down never blocks shopping: every server call
// falls back to the localStorage cart.
import type { CartItem, Product } from '@ecommerce/shared';

const KEY = 'ecommerce-cart-v1';
export const CUSTOMER_TOKEN_KEY = 'customer_token';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string): void {
  window.localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function clearCustomerToken(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return getCustomerToken() !== null;
}

function authHeaders(): Record<string, string> {
  const token = getCustomerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Push the given (or current local) cart to the server. False when not logged in or the API is unreachable. */
export async function syncCartToServer(items: CartItem[] = getCart()): Promise<boolean> {
  if (!getCustomerToken()) return false;
  try {
    const res = await fetch(`${API_URL}/api/cart/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ items }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Merge the local guest cart into the DB cart (call right after login). Returns the merged server cart, or null on failure. */
export async function mergeGuestCartOnLogin(): Promise<CartItem[] | null> {
  const local = getCart();
  if (!getCustomerToken()) return null;
  try {
    const res = await fetch(`${API_URL}/api/cart/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ items: local }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: CartItem[] };
    const merged = data.items ?? local;
    saveCart(merged);
    return merged;
  } catch {
    return null;
  }
}

/** Fetch the logged-in user's server cart. Null when not logged in or the API is down. */
export async function fetchServerCart(): Promise<CartItem[] | null> {
  if (!getCustomerToken()) return null;
  try {
    const res = await fetch(`${API_URL}/api/cart`, { headers: authHeaders() });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: CartItem[] };
    return data.items ?? [];
  } catch {
    return null;
  }
}

/** The cart to render: server cart for logged-in users (cached to localStorage), localStorage otherwise / on API failure. */
export async function loadCart(): Promise<CartItem[]> {
  const server = await fetchServerCart();
  if (server !== null) {
    saveCart(server);
    return server;
  }
  return getCart();
}

export function addProductToCart(p: Product, quantity = 1): CartItem[] {
  const items = getCart();
  const existing = items.find((i) => i.productSlug === p.slug);
  if (existing) existing.quantity += quantity;
  else items.push({ productSlug: p.slug, name: p.name, price: p.price, quantity, image: p.images[0] });
  saveCart(items);
  void syncCartToServer(items);
  return items;
}

export function setQuantity(productSlug: string, quantity: number): CartItem[] {
  const items = getCart().map((i) => (i.productSlug === productSlug ? { ...i, quantity } : i)).filter((i) => i.quantity > 0);
  saveCart(items);
  void syncCartToServer(items);
  return items;
}

export function removeFromCart(productSlug: string): CartItem[] {
  const items = getCart().filter((i) => i.productSlug !== productSlug);
  saveCart(items);
  void syncCartToServer(items);
  return items;
}

export function clearCart(): void {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
  if (getCustomerToken()) {
    void fetch(`${API_URL}/api/cart`, { method: 'DELETE', headers: authHeaders() }).catch(() => undefined);
  }
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
