"use client";

import { formatEther } from "viem";
import { SEPOLIA_FAUCETS, type DemoWalletState } from "@/lib/demoWallet";

/**
 * The built-in demo wallet panel (home page, inside the wallet-info
 * section). Creates/removes the browser-stored Sepolia demo wallet
 * and shows its address and balance, with the honest safety framing
 * repeated every time it appears.
 *
 * State comes from useDemoWallet() in the page, so the home balance
 * card and the CryptoSend source choice read the same wallet.
 */
export function DemoWalletPanel({ wallet }: { wallet: DemoWalletState }) {
  const { ready, address, balance, balanceLoading } = wallet;

  return (
    <div
      className="breakdown"
      role="group"
      aria-label="Built-in demo wallet"
      style={{ marginTop: 4 }}
    >
      <p style={{ margin: "0 0 8px" }}>
        <strong>Built-in demo wallet</strong> — Sepolia test network only.
      </p>

      {!ready ? (
        <p className="hint" style={{ marginBottom: 0 }}>
          Checking this browser for a demo wallet…
        </p>
      ) : !address ? (
        <>
          <p className="hint">
            No demo wallet yet. Create one and the app makes a fresh
            Ethereum account right here — nothing to install, no signup.
            Its key is stored only in this browser.
          </p>
          <div className="actions" style={{ marginBottom: 0 }}>
            <button type="button" onClick={wallet.createWallet}>
              Create demo wallet
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="hint" style={{ wordBreak: "break-all" }}>
            Address: <code>{address}</code>
            <br />
            Balance:{" "}
            {balanceLoading
              ? "loading…"
              : balance === null
                ? "unavailable (network hiccup)"
                : `${Number(formatEther(balance)).toFixed(4)} test ETH`}
            {" · "}
            <button
              type="button"
              onClick={wallet.refreshBalance}
              style={{ padding: "2px 8px", fontSize: 12 }}
            >
              Refresh
            </button>
          </p>
          <p className="hint">
            Need test ETH? Public Sepolia faucets give it away free — paste
            the address above into one:{" "}
            {SEPOLIA_FAUCETS.map((faucet, i) => (
              <span key={faucet.url}>
                {i > 0 ? " · " : ""}
                <a href={faucet.url} target="_blank" rel="noreferrer">
                  {faucet.name}
                </a>
              </span>
            ))}
            .
          </p>
          <div className="actions" style={{ marginBottom: 0 }}>
            <button type="button" onClick={wallet.removeWallet}>
              Remove demo wallet
            </button>
          </div>
        </>
      )}

      <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
        <strong>Demo wallet — test network only.</strong> The key lives in
        this browser&apos;s storage; anyone who can use this browser can
        spend from it, and clearing browser data destroys it forever.{" "}
        <strong>Never send real funds to this address.</strong> There is
        deliberately no key export: a key that never leaves this browser
        can never be pasted into the wrong place.
      </p>
    </div>
  );
}
