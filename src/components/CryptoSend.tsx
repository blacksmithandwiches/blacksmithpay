"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther, isAddress, parseEther, type Hex } from "viem";
import {
  sendFromDemoWallet,
  sepoliaPublicClient,
  type DemoWalletState,
} from "@/lib/demoWallet";

type SendSource = "connected" | "demo";

/**
 * Real Sepolia TESTNET ETH send, from either of two sources:
 * - the visitor's connected wallet (any browser wallet — wagmi
 *   sendTransaction; the wallet asks for confirmation), or
 * - the built-in demo wallet (key stored in this browser; viem signs
 *   locally — see lib/demoWallet.ts).
 * Test ETH has no value.
 *
 * No BlacksmithPay fee on crypto sends — the sender pays the network
 * gas fee, which goes to the Ethereum network, never to BlacksmithPay.
 */
export function CryptoSend({ demoWallet }: { demoWallet: DemoWalletState }) {
  const { address, isConnected } = useAccount();
  const [to, setTo] = useState("");
  const [amountText, setAmountText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const hasConnected = Boolean(isConnected && address);
  const hasDemo = Boolean(demoWallet.address);
  const [source, setSource] = useState<SendSource>(
    hasConnected ? "connected" : "demo",
  );

  // Keep the chosen source valid as wallets come and go.
  useEffect(() => {
    if (source === "connected" && !hasConnected && hasDemo) {
      setSource("demo");
    } else if (source === "demo" && !hasDemo && hasConnected) {
      setSource("connected");
    }
  }, [source, hasConnected, hasDemo]);

  // --- Connected-wallet send (wagmi) ---
  const {
    data: connectedHash,
    sendTransaction,
    isPending: connectedPending,
    error: connectedError,
    reset: resetConnected,
  } = useSendTransaction();

  const { isLoading: connectedConfirming, isSuccess: connectedConfirmed } =
    useWaitForTransactionReceipt({
      hash: connectedHash,
      chainId: sepolia.id,
      query: { enabled: Boolean(connectedHash) },
    });

  // --- Demo-wallet send (local signing) ---
  const [demoHash, setDemoHash] = useState<Hex | null>(null);
  const [demoPending, setDemoPending] = useState(false);
  const [demoConfirmed, setDemoConfirmed] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  // Watch for the demo transaction's receipt once we have a hash.
  useEffect(() => {
    if (!demoHash) return;
    let cancelled = false;
    sepoliaPublicClient
      .waitForTransactionReceipt({ hash: demoHash })
      .then(() => {
        if (!cancelled) {
          setDemoConfirmed(true);
          demoWallet.refreshBalance();
        }
      })
      .catch(() => {
        // Receipt watch is best-effort; the Etherscan link still works.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoHash]);

  const fromAddress =
    source === "connected" ? address : (demoWallet.address ?? undefined);

  function validateForm(): { recipient: `0x${string}`; value: bigint } | null {
    const recipient = to.trim();
    if (!isAddress(recipient)) {
      setFormError("Enter a valid Ethereum address (0x…).");
      return null;
    }
    const amount = Number.parseFloat(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter an amount of test ETH greater than zero.");
      return null;
    }
    try {
      return { recipient, value: parseEther(amountText.trim()) };
    } catch {
      setFormError("That amount could not be parsed as ETH.");
      return null;
    }
  }

  function handleSend() {
    setFormError(null);
    const valid = validateForm();
    if (!valid) return;

    if (source === "connected") {
      resetConnected();
      sendTransaction({
        to: valid.recipient,
        value: valid.value,
        chainId: sepolia.id,
      });
      return;
    }

    // Demo wallet: check the balance covers amount + a gas allowance.
    if (demoWallet.balance !== null && valid.value >= demoWallet.balance) {
      setFormError(
        "That is more than the demo wallet holds — remember a little test ETH must stay behind for the network gas fee.",
      );
      return;
    }
    setDemoError(null);
    setDemoHash(null);
    setDemoConfirmed(false);
    setDemoPending(true);
    sendFromDemoWallet({ to: valid.recipient, value: valid.value })
      .then((hash) => {
        setDemoHash(hash);
        demoWallet.refreshBalance();
      })
      .catch((err: unknown) => {
        setDemoError(
          err instanceof Error
            ? (err.message.split("\n")[0] ?? "send failed")
            : "send failed",
        );
      })
      .finally(() => setDemoPending(false));
  }

  const hash = source === "connected" ? connectedHash : demoHash;
  const isPending =
    source === "connected" ? connectedPending : demoPending;
  const confirming =
    source === "connected" ? connectedConfirming : Boolean(demoHash) && !demoConfirmed;
  const confirmed =
    source === "connected" ? connectedConfirmed : demoConfirmed;
  const sendErrorMessage =
    source === "connected"
      ? connectedError
        ? (connectedError.message.split("\n")[0] ?? "wallet error")
        : null
      : demoError;

  return (
    <section className="panel" aria-label="Send Sepolia test ETH">
      <h3 style={{ marginTop: 0 }}>Send crypto — Sepolia testnet</h3>
      <p className="hint">
        Sends REAL transactions on the Sepolia TEST network. Test ETH has
        no value. <strong>No BlacksmithPay fee on crypto sends</strong> —
        you only pay the network gas fee, which goes to the Ethereum
        network, not to BlacksmithPay.
      </p>

      {!hasConnected && !hasDemo ? (
        <p className="hint">
          Nothing to send from yet. Either press &ldquo;Connect
          wallet&rdquo; at the top of the page and bring a wallet you
          already have (any Ethereum browser wallet), or create the
          built-in demo wallet in the section above — nothing to install.
        </p>
      ) : (
        <>
          {hasConnected && hasDemo ? (
            <div className="field">
              <label htmlFor="rw-cs-source">Send from</label>
              <select
                id="rw-cs-source"
                value={source}
                onChange={(e) => setSource(e.target.value as SendSource)}
              >
                <option value="connected">
                  Connected wallet ({address?.slice(0, 6)}…{address?.slice(-4)})
                </option>
                <option value="demo">
                  Built-in demo wallet ({demoWallet.address?.slice(0, 6)}…
                  {demoWallet.address?.slice(-4)})
                </option>
              </select>
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="rw-cs-to">Recipient address</label>
            <input
              id="rw-cs-to"
              type="text"
              placeholder="0x…"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="rw-cs-amount">Amount (test ETH)</label>
            <input
              id="rw-cs-amount"
              type="number"
              min="0"
              step="0.001"
              inputMode="decimal"
              placeholder="0.01"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
            />
          </div>
          <p className="hint">
            Sending from {fromAddress} ·{" "}
            {source === "demo"
              ? `built-in demo wallet (balance ${
                  demoWallet.balance === null
                    ? "…"
                    : `${Number(formatEther(demoWallet.balance)).toFixed(4)} test ETH`
                })`
              : "connected wallet"}{" "}
            · Sepolia testnet
          </p>

          {formError ? <p className="error">{formError}</p> : null}
          {sendErrorMessage ? (
            <p className="error">Transaction not sent: {sendErrorMessage}</p>
          ) : null}

          <div className="actions" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className="primary"
              disabled={isPending || confirming}
              onClick={handleSend}
            >
              {isPending
                ? source === "connected"
                  ? "Confirm in your wallet…"
                  : "Sending…"
                : confirming
                  ? "Confirming on Sepolia…"
                  : "Send test ETH"}
            </button>
          </div>

          {hash ? (
            <p className="hint" style={{ marginTop: 12 }}>
              Transaction hash: <code>{hash}</code>
              <br />
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
              >
                View on Sepolia Etherscan
              </a>
              {confirmed ? " · Confirmed ✓" : " · Waiting for confirmation…"}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
