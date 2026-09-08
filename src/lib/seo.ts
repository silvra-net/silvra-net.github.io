import { useEffect } from "react";

/**
 * Set the document title and meta description for a page.
 *
 * The site is a client-rendered SPA, so crawlers that do not execute JavaScript see only
 * index.html. This keeps the title correct for everything that does — browsers, tabs,
 * bookmarks, link previews that render — without pretending to be server-side rendering.
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
