import Icon from "./Icon";

export interface QA {
  q: string;
  a: string;
}

/**
 * Questions people actually ask, as native disclosure widgets: keyboard and screen-reader
 * behaviour come from the browser, and every answer is in the document — open or not — for
 * search engines and for the page's own structured data.
 */
export default function Faq({ items }: { items: QA[] }) {
  return (
    <div className="faq">
      {items.map((it) => (
        <details key={it.q} className="faq-item spot">
          <summary>
            <span>{it.q}</span>
            <span className="faq-icon" aria-hidden="true">
              <Icon name="plus" size={18} />
            </span>
          </summary>
          <div className="faq-answer">
            <p>{it.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
