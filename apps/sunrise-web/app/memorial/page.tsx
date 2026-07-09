export default function MemorialPlaceholderPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Memorial</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Placeholder route</h1>
      <p className="leading-relaxed text-muted-foreground">
        Memorial-specific flows will land here. Styling follows the active brand (Sunset tokens when the host or{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-sm">NEXT_PUBLIC_BRAND_ID</code> selects Sunset).
      </p>
    </main>
  )
}
