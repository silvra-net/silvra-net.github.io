import { useI18n } from "../i18n";

interface Group {
  heading: string;
  items: { title: string; body: string }[];
}

function isGroup(v: unknown): v is Group {
  return (
    typeof v === "object" && v !== null &&
    typeof (v as Group).heading === "string" && Array.isArray((v as Group).items)
  );
}

/**
 * Render every `{heading, items[]}` block found under `path`, in key order.
 *
 * The content blocks pair up differently per section — "what you can expect" against what we
 * avoid, "encrypted" against "not encrypted" — so the sub-keys are read from the data rather
 * than named here. A section that gains a third column needs no code change.
 */
export default function Groups({ path }: { path: string }) {
  const { raw } = useI18n();
  const node = raw(path);
  if (typeof node !== "object" || node === null) return null;

  const groups = Object.entries(node as Record<string, unknown>).filter(
    (entry): entry is [string, Group] => isGroup(entry[1]),
  );
  if (groups.length === 0) return null;

  return (
    <div className={`grid ${groups.length === 2 ? "two" : "three"}`}>
      {groups.map(([key, g]) => (
        <div className="card" key={key}>
          <h3>{g.heading}</h3>
          <dl style={{ margin: 0 }}>
            {g.items.map((it) => (
              <div key={it.title} style={{ marginTop: 16 }}>
                <dt style={{ fontWeight: 600 }}>{it.title}</dt>
                <dd className="muted small" style={{ margin: "4px 0 0" }}>
                  {it.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
