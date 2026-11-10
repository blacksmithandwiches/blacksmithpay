"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

/**
 * Built-in DEMO wallet for the BlacksmithPay prototype.
 *
 * What this is: a throwaway Ethereum account for the Sepolia TEST
 * network, created right in the browser. The private key is generated
 * locally and stored in this browser's localStorage — nothing is sent
 * anywhere, no account is registered, nothing is backed up.
 *
 * What this is NOT: a safe place for real money. Anyone who can use
 * this browser can spend from this wallet, and clearing browser data
 * destroys the key forever. It exists so anyone can try the crypto
 * side of BlacksmithPay with zero installs.
 *
 * - Sepolia testnet ONLY. Test ETH has no value.
 * - There is deliberately NO private-key export in v1: a key that
 *   never leaves the browser's storage can never be pasted into a
 *   phishing site or a chat window.
 * - Removing the wallet deletes the key from localStorage.
 */

const STORAGE_KEY = "blacksmithpay-demo-wallet-v1";

/** Public Sepolia RPC (viem's default for the chain). Read + relay only. */
export const sepoliaPublicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

/**
 * Public Sepolia faucets — free test ETH, no real money involved.
 * Anyone can hold a demo-wallet address up to these.
 */
export const SEPOLIA_FAUCETS: ReadonlyArray<{ name: string; url: string }> = [
  { name: "Google Cloud Web3 faucet", url: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia" },
  { name: "Sepolia Faucet (sepoliafaucet.com)", url: "https://sepoliafaucet.com" },
  { name: "Alchemy Sepolia faucet", url: "https://www.alchemy.com/faucets/ethereum-sepolia" },
];

function isValidKey(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function readStoredKey(): Hex | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isValidKey(raw) ? raw : null;
  } catch {
    return null;
  }
}

export type DemoWalletState = {
  /** False until localStorage has been read (avoids SSR/hydration flicker). */
  ready: boolean;
  /** The demo wallet's address, or null when no demo wallet exists. */
  address: Address | null;
  /** Sepolia balance in wei, null while unknown/loading. */
  balance: bigint | null;
  /** True while a balance fetch is in flight. */
  balanceLoading: boolean;
  createWallet: () => void;
  removeWallet: () => void;
  refreshBalance: () => void;
};

export function useDemoWallet(): DemoWalletState {
  const [privateKey, setPrivateKey] = useState<Hex | null>(null);
  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Load the stored key after mount (keeps SSR/first render stable).
  useEffect(() => {
    setPrivateKey(readStoredKey());
    setReady(true);
  }, []);

  const address = privateKey
    ? privateKeyToAccount(privateKey).address
    : null;

  const refreshBalance = useCallback(() => {
    if (!address) {
      setBalance(null);
      return;
    }
    setBalanceLoading(true);
    sepoliaPublicClient
      .getBalance({ address })
      .then((value) => setBalance(value))
      .catch(() => setBalance(null))
      .finally(() => setBalanceLoading(false));
  }, [address]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const createWallet = useCallback(() => {
    const key = generatePrivateKey();
    try {
      window.localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // Storage blocked — the wallet still works for this session.
    }
    setPrivateKey(key);
  }, []);

  const removeWallet = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up if storage is blocked.
    }
    setPrivateKey(null);
    setBalance(null);
  }, []);

  return {
    ready,
    address,
    balance,
    balanceLoading,
    createWallet,
    removeWallet,
    refreshBalance,
  };
}

/**
 * Send Sepolia test ETH FROM the built-in demo wallet.
 *
 * Signs locally with viem (privateKeyToAccount + a wallet client on
 * Sepolia) and relays through the same public RPC used for reads.
 * Returns the transaction hash. Throws on any failure — callers show
 * the message. Only ever call this with the stored demo key.
 */
export async function sendFromDemoWallet(args: {
  to: Address;
  value: bigint;
}): Promise<Hex> {
  const key = readStoredKey();
  if (!key) {
    throw new Error("No demo wallet exists in this browser.");
  }
  const account = privateKeyToAccount(key);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });
  return walletClient.sendTransaction({
    to: args.to,
    value: args.value,
    chain: sepolia,
  });
}
