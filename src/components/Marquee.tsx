/**
 * A slow band of large outlined claims, separated by the blade's slash.
 *
 * The list is rendered twice inside a track that translates by exactly half its width, which is
 * what makes the loop seamless without measuring anything. The duplicate is hidden from
 * assistive technology so the phrases are announced once, as a list, not twice.
 */
export default function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="marquee">
      <ul className="sr-only">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <div className="marquee-track" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div className="marquee-run" key={copy}>
            {items.map((item) => (
              <span className="marquee-item" key={item}>
                {item}
                <span className="marquee-slash">/</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
