import { useState } from "react";
import { useI18n } from "../i18n";

/**
 * Shell commands in a terminal frame, with a copy button. Comments are set apart from the
 * commands so the block reads as instructions, and only the commands are copied.
 */
export default function CodeBlock({ title, lines }: { title: string; lines: string[] }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const commands = lines.filter((l) => l.trim() && !l.trim().startsWith("#")).join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(commands);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* no clipboard permission: the text is still there to select by hand */
    }
  };

  return (
    <div className="terminal code-block">
      <div className="terminal-bar">
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <span className="mono">{title}</span>
        <button type="button" className="code-copy" onClick={copy} aria-live="polite">
          {copied ? t("common.copied") : t("common.copy")}
        </button>
      </div>
      <pre className="code-body">
        {lines.map((l, i) => (
          <span key={i} className={l.trim().startsWith("#") ? "code-comment" : "code-line"}>
            {l}
            {"\n"}
          </span>
        ))}
      </pre>
    </div>
  );
}
