import { getPolar } from '../lib/polar.js';

export async function createCheckoutSession(
  productId: string,
  successUrl: string,
  customerEmail?: string
): Promise<string> {
  const polar = getPolar();
  const checkout = await polar.checkouts.create({
    productId,
    successUrl,
    customerEmail,
  });
  return checkout.url;
}

export async function createCustomerPortalSession(customerId: string): Promise<string> {
  const polar = getPolar();
  const portal = await polar.customerPortal.create({ customerId });
  return portal.url;
}
