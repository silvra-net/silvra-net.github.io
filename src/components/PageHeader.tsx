import type { ReactNode } from "react";

/**
 * The opening band of a subpage.
 *
 * Every page gets one, so a visitor arriving from search lands on something that introduces
 * itself rather than on a paragraph. It carries the dot texture instead of film: the hero video
 * is the home page's own gesture, and repeating it on six pages would make it wallpaper.
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-header">
      <div className="container">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="lead">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
