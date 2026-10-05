// src/app/page.tsx
// Home page.

import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Fee<span className="text-accent">Leaks</span>
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        What schools, colleges, universities and tuition centres really charge — shared
        anonymously by the parents and students who paid.
      </p>
      <Link
        href="/leak"
        className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 font-semibold text-accent-foreground sm:w-auto"
      >
        Leak a fee
      </Link>
    </div>
  );
}
