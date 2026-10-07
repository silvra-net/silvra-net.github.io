import type { ReactNode } from "react";
import Scramble from "./Scramble";

/**
 * The opening of a page that is not a product: dark in both themes, so the header can sit over
 * it transparently, with a diagonal edge where it meets the page — the blade of the home page,
 * carried through the site as its one recurring shape.
 */
export default function PageHero({
  label,
  title,
  lead,
  children,
  media,
}: {
  label?: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
  media?: ReactNode;
}) {
  return (
    <section className="page-hero dark-zone">
      {media && (
        <div className="page-hero-media" aria-hidden="true">
          {media}
        </div>
      )}
      <div className="page-hero-grid" aria-hidden="true" />
      <div className="container page-hero-body">
        {label && (
          <p className="label">
            <Scramble text={label} />
          </p>
        )}
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
