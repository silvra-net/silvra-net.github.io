export interface Item {
  title: string;
  body: string;
  tag?: string;
  points?: string[];
}

/** A grid of cards. `columns` is a hint: below the breakpoint every grid collapses to one. */
export default function Cards({ items, columns = 3 }: { items: Item[]; columns?: 2 | 3 }) {
  return (
    <div className={`grid ${columns === 2 ? "two" : "three"}`}>
      {items.map((it) => (
        <article className="card" key={it.title}>
          {it.tag && <p className="eyebrow">{it.tag}</p>}
          <h3>{it.title}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {it.body}
          </p>
          {it.points && it.points.length > 0 && (
            <ul className="small muted" style={{ margin: "16px 0 0", paddingLeft: "18px" }}>
              {it.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
