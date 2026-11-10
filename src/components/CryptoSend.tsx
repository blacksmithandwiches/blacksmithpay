"use client";

import { useState } from "react";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { isAddress, parseEther } from "viem";

/**
 * Real Sepolia TESTNET ETH send through the connected MetaMask wallet
 * (wagmi sendTransaction). Test ETH has no value.
 *
 * No BlacksmithPay fee on crypto sends — the sender pays the network gas
 * fee, which goes to the Ethereum network, never to BlacksmithPay.
 */
export function CryptoSend() {
  const { address, isConnected } = useAccount();
  const [to, setTo] = useState("");
  const [amountText, setAmountText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: hash,
    sendTransaction,
    isPending,
    error: sendError,
    reset,
  } = useSendTransaction();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({
      hash,
      chainId: sepolia.id,
      query: { enabled: Boolean(hash) },
    });

  function handleSend() {
    setFormError(null);
    const recipient = to.trim();
    if (!isAddress(recipient)) {
      setFormError("Enter a valid Ethereum address (0x…).");
      return;
    }
    const amount = Number.parseFloat(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter an amount of test ETH greater than zero.");
      return;
    }
    let value: bigint;
    try {
      value = parseEther(amountText.trim());
    } catch {
      setFormError("That amount could not be parsed as ETH.");
      return;
    }
    reset();
    sendTransaction({ to: recipient, value, chainId: sepolia.id });
  }

  return (
    <section className="panel" aria-label="Send Sepolia test ETH">
      <h3 style={{ marginTop: 0 }}>Send crypto — Sepolia testnet</h3>
      <p className="hint">
        Sends REAL transactions on the Sepolia TEST network through your
        connected MetaMask wallet. Test ETH has no value.{" "}
        <strong>No BlacksmithPay fee on crypto sends</strong> — you only pay
        the network gas fee, which goes to the Ethereum network, not to
        BlacksmithPay.
      </p>

      {!isConnected ? (
        <p className="hint">
          MetaMask is not connected. Connect MetaMask (button at the top,
          Sepolia network) to send test ETH.
        </p>
      ) : (
        <>
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
          <p className="hint">Sending from {address} · Sepolia testnet</p>

          {formError ? <p className="error">{formError}</p> : null}
          {sendError ? (
            <p className="error">
              Transaction not sent:{" "}
              {sendError.message.split("\n")[0] ?? "wallet error"}
            </p>
          ) : null}

          <div className="actions" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className="primary"
              disabled={isPending || confirming}
              onClick={handleSend}
            >
              {isPending
                ? "Confirm in MetaMask…"
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
