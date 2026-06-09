// A simple placeholder for tabs we'll build in later phases. Keeps the app
// navigable and shows what's coming.
export function PagePlaceholder({
  title,
  phase,
  blurb,
}: {
  title: string
  phase: string
  blurb: string
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6 rounded-card border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium text-primary">{phase}</p>
        <p className="mt-2 text-muted">{blurb}</p>
      </div>
    </div>
  )
}
