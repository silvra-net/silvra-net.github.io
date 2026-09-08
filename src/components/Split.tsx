import type { ReactNode } from "react";

/**
 * A full-bleed band: media on one side, words on the other, nothing between them and the edge
 * of the window. The measure still applies to the text — a paragraph does not become readable
 * by being given half a screen.
 */
export default function Split({
  media,
  children,
  flip = false,
}: {
  media: ReactNode;
  children: ReactNode;
  flip?: boolean;
}) {
  return (
    <section className={flip ? "split flip" : "split"}>
      <div className="split-media">{media}</div>
      <div className="split-body">
        <div className="split-inner">{children}</div>
      </div>
    </section>
  );
}
