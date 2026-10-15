import type { ReactNode } from "react";
import Scramble from "./Scramble";
import HudFrame from "./HudFrame";

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
  compact = false,
  last = false,
}: {
  label?: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
  media?: ReactNode;
  /** A short opening for pages that are read rather than entered. */
  compact?: boolean;
  /** Nothing follows but the footer: a straight lower edge instead of the diagonal. */
  last?: boolean;
}) {
  const cls = `page-hero${compact ? " page-hero--compact" : ""}${last ? " page-hero--last" : ""} dark-zone`;
  return (
    <section className={cls}>
      {media && (
        <div className="page-hero-media" aria-hidden="true">
          {media}
        </div>
      )}
      <div className="page-hero-grid" aria-hidden="true" />
      <HudFrame />
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
