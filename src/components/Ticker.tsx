/**
 * A slow marquee of short claims.
 *
 * The list is rendered twice inside a track that translates by exactly half its width, which is
 * what makes the loop seamless without measuring anything. The duplicate is hidden from
 * assistive technology so the phrases are announced once, not twice.
 */
export default function Ticker({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="ticker" aria-label={items.join(", ")}>
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <div className="ticker-run" key={copy} aria-hidden={copy === 1}>
            {items.map((item) => (
              <span className="badge" key={item}>
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
