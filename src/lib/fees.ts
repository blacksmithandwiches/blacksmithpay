import type { FiatCurrency } from "./ledger";

/**
 * BlacksmithPay fee schedule + MOCK exchange rates (prototype).
 *
 * TEST MONEY ONLY. Every fee is computed here so the UI can show the
 * exact fee BEFORE the user confirms — fees are never hidden and never
 * applied silently. Network gas is NOT part of this schedule: gas is
 * paid to the Ethereum network by the sender, never to BlacksmithPay.
 */

/** Exchange (fiat <-> crypto): 0.85% of the fiat side. */
export const EXCHANGE_FEE_RATE = 0.0085;

/** Fiat Send inside BlacksmithPay: 0.5% of the sent amount, paid by sender. */
export const TRANSFER_FEE_RATE = 0.005;

/** Payment links: seller pays 2.9% + a fixed $0.30 per payment. */
export const LINK_FEE_RATE = 0.029;
export const LINK_FEE_FIXED = 0.3;

/** Crypto sends: no BlacksmithPay fee (gas goes to the network). */
export const CRYPTO_SEND_FEE_RATE = 0;

/**
 * MOCK ETH prices for the demo exchange. NOT market prices — labelled
 * as mock rates everywhere they appear.
 */
export const MOCK_ETH_PRICE: Record<FiatCurrency, number> = {
  CAD: 4200,
  USD: 3100,
};

/** Round to cents (fiat) — used for every fee and fiat movement. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Round ETH amounts to 6dp for display/ledger sanity. */
export function roundEth(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e6) / 1e6;
}

export type ExchangeQuote = {
  /** Fiat the user pays in (buy) or the gross fiat value (sell). */
  fiatIn: number;
  /** BlacksmithPay fee, in fiat. */
  fee: number;
  /** ETH the user receives (buy) — already net of the fee. */
  ethOut: number;
  /** Fiat the user receives (sell) — already net of the fee. */
  fiatOut: number;
  rate: number;
};

/**
 * Buy: user spends `fiatAmount`; the 0.85% fee comes out of that amount
 * first, the rest buys ETH at the mock rate.
 * Sell: user sells `ethAmount` of demo ETH; gross = eth * rate, the
 * 0.85% fee comes out of the gross, the user receives the rest.
 */
export function quoteExchange(
  direction: "buy" | "sell",
  currency: FiatCurrency,
  amount: number,
): ExchangeQuote {
  const rate = MOCK_ETH_PRICE[currency];
  if (direction === "buy") {
    const fee = round2(amount * EXCHANGE_FEE_RATE);
    const net = amount - fee;
    return {
      fiatIn: amount,
      fee,
      ethOut: roundEth(net / rate),
      fiatOut: 0,
      rate,
    };
  }
  const gross = round2(amount * rate);
  const fee = round2(gross * EXCHANGE_FEE_RATE);
  return {
    fiatIn: gross,
    fee,
    ethOut: 0,
    fiatOut: round2(gross - fee),
    rate,
  };
}

/** Fee for a fiat Send of `amount` (sender pays on top). */
export function transferFee(amount: number): number {
  return round2(amount * TRANSFER_FEE_RATE);
}

/** Seller fee for a payment-link payment of `amount`. */
export function linkFee(amount: number): number {
  return round2(amount * LINK_FEE_RATE + LINK_FEE_FIXED);
}
