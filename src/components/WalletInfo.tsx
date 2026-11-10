"use client";

import { useAccount } from "wagmi";
import type { DemoWalletState } from "@/lib/demoWallet";
import { DemoWalletPanel } from "./DemoWalletPanel";

/**
 * Plain-language explainer for the crypto side, wallet-agnostic by
 * design (Dmitri's ruling, Nov 10, 2026): BlacksmithPay talks to the
 * Ethereum network; no single company's wallet is required — MetaMask
 * is only an example. Three ways in: a wallet you already have, the
 * built-in demo wallet, and (coming next) phone wallets by QR code.
 */
export function WalletInfo({ demoWallet }: { demoWallet: DemoWalletState }) {
  const { isConnected } = useAccount();
  const wcEnabled = Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);

  return (
    <section
      className="panel"
      aria-label="How crypto connects to Ethereum"
    >
      <h3 style={{ marginTop: 0 }}>
        Crypto connects to Ethereum — your choice of wallet
      </h3>
      <p className="hint">
        BlacksmithPay talks directly to the <strong>Ethereum network</strong>{" "}
        (in this prototype, the <strong>Sepolia test network</strong>, where
        the ETH is play money). The app does not require one company&apos;s
        wallet: a wallet is just the key to your crypto account, and there
        are three ways to bring one.
      </p>

      <p className="hint" style={{ marginBottom: 8 }}>
        <strong>Way 1 — a wallet you already have.</strong> Any Ethereum
        browser wallet connects with the &ldquo;Connect wallet&rdquo; button
        at the top of this page — for example MetaMask, Rabby, Coinbase
        Wallet or Brave Wallet. Your wallet asks your permission before
        anything moves.{" "}
        {isConnected ? (
          <strong>Your wallet is connected now.</strong>
        ) : (
          <>
            Don&apos;t have one? They are free — for example,{" "}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
            >
              MetaMask from metamask.io
            </a>{" "}
            (the official site). On a phone, open this page inside your
            wallet app&apos;s browser.
          </>
        )}
      </p>

      <DemoWalletPanel wallet={demoWallet} />

      <p className="hint" style={{ marginTop: 12 }}>
        <strong>Way 3 — phone wallets by QR code (WalletConnect)</strong> —{" "}
        {wcEnabled ? (
          <>
            available above: choose the WalletConnect option when you press
            &ldquo;Connect wallet&rdquo; and scan the code with your phone
            wallet.
          </>
        ) : (
          <>
            <em>coming next.</em> It will let any phone wallet pair with this
            page by scanning a code — no browser extension needed.
          </>
        )}
      </p>

      <p className="hint">
        <strong>And the fiat side needs no wallet at all:</strong> CAD and
        USD move through BlacksmithPay&apos;s own ledger — send, request and
        payment links. In this prototype that ledger is demo money stored in
        your browser; a real-money launch will run the fiat side through
        licensed partners.
      </p>

      <p className="hint" style={{ marginBottom: 0 }}>
        <strong>Safety:</strong> never share a recovery phrase or a private
        key with anyone — not with this app, not in any chat. BlacksmithPay
        never asks for one.
      </p>
    </section>
  );
}
