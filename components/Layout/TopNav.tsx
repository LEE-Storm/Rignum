import Link from "next/link";

export function TopNav() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl p-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold">
          Rignum
        </Link>

        <nav className="text-sm flex flex-wrap gap-4">
          <Link className="underline" href="/">
            Home
          </Link>
          <Link className="underline" href="/disclaimer">
            Disclaimer
          </Link>
          <Link className="underline" href="/terms">
            Terms
          </Link>
          <Link className="underline" href="/privacy">
            Privacy
          </Link>
        </nav>
      </div>
    </header>
  );
}
