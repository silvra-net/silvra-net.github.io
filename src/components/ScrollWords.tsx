import { useRef } from "react";
import { useScrollProgress } from "../lib/motion";

/**
 * A statement whose words light up one after another as it is scrolled through — read at the
 * pace of the scroll rather than all at once.
 *
 * Only opacity changes, and only through one custom property the browser interpolates per word;
 * the text itself is ordinary text in the document from the start.
 */
export default function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useScrollProgress(ref, 0.9, 0.55);
  const words = text.split(" ");
  return (
    <p ref={ref} className={className ? `scroll-words ${className}` : "scroll-words"} style={{ ["--n" as string]: words.length }}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} style={{ ["--i" as string]: i }}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
