type BalanceCardProps = {
  label: string;
  amount: string;
  sub?: string;
};

/** One balance tile on the wallet home (CAD, USD, or crypto). */
export function BalanceCard({ label, amount, sub }: BalanceCardProps) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="amount">{amount}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  );
}
