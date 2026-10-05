// src/components/site-footer.tsx
// Footer with the standing disclaimer.

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border print:hidden">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
        <p>
          Reports are submitted anonymously by users and are not verified by FeeLeaks.{" "}
          <Link href="/about" className="underline hover:text-foreground">
            About and disclaimer
          </Link>
        </p>
      </div>
    </footer>
  );
}
