import { useRef } from "react";
import { useScrollProgress } from "../lib/motion";

interface Step {
  when: string;
  title: string;
  body: string;
}

/**
 * Harvest now, decrypt later — as three steps on a line that fills as it is scrolled past.
 * The colours are the design system's state colours: amber for the threat that is already
 * practice, red for the one that is coming, green for what holds.
 */
export default function Timeline({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLOListElement>(null);
  useScrollProgress(ref, 0.8, 0.5);
  return (
    <ol ref={ref} className="timeline" style={{ ["--n" as string]: steps.length }}>
      {steps.map((s, i) => (
        <li key={s.title} className={`timeline-step step-${i}`} style={{ ["--i" as string]: i }}>
          <span className="timeline-node" aria-hidden="true" />
          <p className="timeline-when">{s.when}</p>
          <h3>{s.title}</h3>
          <p className="muted">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
