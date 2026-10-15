import { photoSrc } from "../lib/photos";
import type { Slot } from "../lib/photos";

/** Written lowercase and spread in: React 18 does not know the camel-cased prop yet and would warn,
 *  while an unknown lowercase attribute is passed through as it is. */
export const HIGH_PRIORITY = { fetchpriority: "high" } as const;

/**
 * A photograph from the slot registry, cropped to fill whatever box it is put in. Decorative by
 * default (empty alt): the pages say in words what the pictures only set a mood for.
 *
 * `priority` is for the picture in a page's opening: loaded at once and ahead of the rest, since
 * it is usually the largest thing on the first screen.
 */
export default function Photo({
  slot,
  className,
  alt = "",
  priority = false,
}: {
  slot: Slot;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  const src = photoSrc(slot);
  return (
    <div className={className ? `photo ${className}` : "photo"} data-slot={slot}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          {...(priority ? HIGH_PRIORITY : {})}
        />
      ) : (
        <div className="photo-fallback" aria-hidden="true" />
      )}
    </div>
  );
}
