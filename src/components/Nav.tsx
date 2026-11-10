import Link from "next/link";

/** Top navigation between the prototype's screens. */
export function Nav() {
  return (
    <nav className="nav" aria-label="BlacksmithPay screens">
      <Link href="/">Wallet home</Link>
      <Link href="/exchange">Exchange</Link>
      <Link href="/payments">Payment links</Link>
    </nav>
  );
}
