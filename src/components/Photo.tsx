import { photoSrc } from "../lib/photos";
import type { Slot } from "../lib/photos";

/**
 * A photograph from the slot registry, cropped to fill whatever box it is put in. Decorative by
 * default (empty alt): the pages say in words what the pictures only set a mood for.
 */
export default function Photo({ slot, className, alt = "", eager = false }: { slot: Slot; className?: string; alt?: string; eager?: boolean }) {
  const src = photoSrc(slot);
  return (
    <div className={className ? `photo ${className}` : "photo"} data-slot={slot}>
      {src ? (
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
      ) : (
        <div className="photo-fallback" aria-hidden="true" />
      )}
    </div>
  );
}
