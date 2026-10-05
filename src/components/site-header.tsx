// src/components/site-header.tsx
// Top bar: logo, navigation, this browser's anonymous username and the "Leak a fee" button.

import Link from "next/link";
import { readIdentity } from "@/lib/identity/session";

export async function SiteHeader() {
  const identity = await readIdentity();
  const username = identity?.names[0];

  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Fee<span className="text-accent">Leaks</span>
        </Link>
        <nav className="ml-2 hidden gap-4 text-sm text-muted sm:flex">
          <Link href="/search" className="hover:text-foreground">Search</Link>
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {username && (
            <span
              className="hidden max-w-[11rem] truncate font-mono text-xs text-muted sm:inline"
              title="Your anonymous name on this browser"
            >
              {username}
            </span>
          )}
          <Link
            href="/leak"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            Leak a fee
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-5 px-4 pb-3 text-sm text-muted sm:hidden">
        <Link href="/search" className="hover:text-foreground">Search</Link>
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <Link href="/about" className="hover:text-foreground">About</Link>
        {username && <span className="ml-auto truncate font-mono text-xs leading-5">{username}</span>}
      </nav>
    </header>
  );
}
