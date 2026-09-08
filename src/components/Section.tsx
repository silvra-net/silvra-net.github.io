import type { ReactNode } from "react";
import Reveal from "./Reveal";

interface Props {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  id?: string;
  children?: ReactNode;
}

/** One band of the page: an optional eyebrow/title/subtitle head, then whatever it introduces. */
export default function Section({ eyebrow, title, subtitle, id, children }: Props) {
  return (
    <section className="section" id={id}>
      <div className="container">
        <Reveal>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h2>{title}</h2>}
        {subtitle && <p className="lead">{subtitle}</p>}
        {children}
        </Reveal>
      </div>
    </section>
  );
}
