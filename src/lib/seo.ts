import { useEffect } from "react";

/**
 * Set the document title and meta description for a page.
 *
 * Keeps title and description in step with the language after hydration; the prerendered head
 * (scripts/prerender.mjs) is what crawlers read.
 */
export function useSeo(title: string, description: string): void {
  useEffect(() => {
    document.title = title;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = description;
  }, [title, description]);
}
