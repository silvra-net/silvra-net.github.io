/**
 * Europe, abstractly: twelve small squares on a ring, without borrowing the EU's emblem. Squares
 * rather than dots, so it reads as the site's own pixel language and not as a loading spinner;
 * still, never animated. In the text colour, like the icons.
 */
const MARKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  // Rounded to keep the server and client markup identical character for character.
  return { x: +(8 + 6 * Math.sin(a) - 0.8).toFixed(3), y: +(8 - 6 * Math.cos(a) - 0.8).toFixed(3) };
});

export default function EuMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className ? `eu-mark ${className}` : "eu-mark"}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {MARKS.map((m, i) => (
        <rect key={i} x={m.x} y={m.y} width="1.6" height="1.6" />
      ))}
    </svg>
  );
}
