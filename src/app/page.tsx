// src/app/page.tsx
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center">
        <p className="font-mono text-sm uppercase tracking-widest text-accent">
          Coming soon
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Fee<span className="text-accent">Leaks</span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          What schools, colleges, universities and tuition centres really
          charge — shared anonymously by the parents and students who paid.
        </p>
        <button
          type="button"
          disabled
          className="mt-8 h-12 w-full rounded-full bg-accent px-6 font-semibold text-accent-foreground opacity-60 sm:w-auto"
        >
          Leak a fee
        </button>
        <p className="mt-3 text-sm text-muted">Reporting opens shortly.</p>
      </div>
    </main>
  );
}
