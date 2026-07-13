/** Pills: a wrapped row of small rounded tags. Ported from the pills() helper. */
export function Pills({ items }: { items: string[] }) {
  return (
    <div className="pills">
      {items.map((s) => (
        <span className="pill" key={s}>
          {s}
        </span>
      ))}
    </div>
  );
}
