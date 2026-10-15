import type { ReactNode } from "react";

/**
 * A text with its unit symbols kept in their own case. Mono labels are set in capitals, and a
 * capital S is the siemens, not the second: "≈ 2 s" must not turn into "≈ 2 S". Only a lone "s"
 * right after a number is a unit; every other letter follows the label.
 */
export default function Units({ text }: { text: string }) {
  const parts = text.split(/(?<=\d[\s ])(s)(?=[\s ·,.]|$)/);
  if (parts.length === 1) return <>{text}</>;
  const out: ReactNode[] = parts.map((p, i) =>
    i % 2 ? (
      <span className="unit" key={i}>
        {p}
      </span>
    ) : (
      p
    ),
  );
  return <>{out}</>;
}
