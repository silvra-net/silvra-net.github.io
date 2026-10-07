/**
 * The site's icon set: simple stroke drawings on a 24-unit grid, in the text colour.
 *
 * Inline rather than an icon font or a library: there are about thirty of them, each is a
 * couple of path commands, and they inherit `currentColor` so every world colours them for free.
 */
const PATHS: Record<string, string> = {
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowUpRight: "M7 17 17 7M8 7h9v9",
  arrowDown: "M12 5v14M6 13l6 6 6-6",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  plus: "M12 5v14M5 12h14",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM16 16h2v2h-2z",
  chat: "M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5Z",
  feed: "M5 4.5a14.5 14.5 0 0 1 14.5 14.5M5 10.5a8.5 8.5 0 0 1 8.5 8.5M6 18.5h.01",
  wallet: "M3.5 7.5v10a2 2 0 0 0 2 2h14v-12h-14a2 2 0 0 1 0-4h12v4M16.5 13.5h.01",
  ban: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM5.6 5.6l12.8 12.8",
  coins: "M9 4a5 5 0 1 0 0 10A5 5 0 0 0 9 4ZM14.2 8.6a5 5 0 1 1-5.6 6.9",
  mail: "M4.5 5.5h15a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17V7a1.5 1.5 0 0 1 1.5-1.5ZM3.5 7l8.5 6 8.5-6",
  landmark: "M3 20.5h18M5 20.5v-9M9.5 20.5v-9M14.5 20.5v-9M19 20.5v-9M2.5 9.5 12 4l9.5 5.5Z",
  lock: "M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5ZM8 10.5V7.5a4 4 0 0 1 8 0v3",
  unlock: "M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5ZM8 10.5V7.5a4 4 0 0 1 7.7-1.5",
  shield: "M12 3l7.5 3v5.5c0 4.7-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.8-7.5-9.5V6L12 3ZM8.8 12l2.2 2.2 4.2-4.4",
  alert: "M12 3.5 21.5 20h-19L12 3.5ZM12 10v4.5M12 17.2h.01",
  check: "M5 12.5l4.5 4.5L19 7.5",
  key: "M8 11a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM11.2 12.3 19.5 4M16.5 7l2.5 2.5M14.5 9l2 2",
  play: "M7 4.5v15l12.5-7.5L7 4.5Z",
  code: "M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15",
  people:
    "M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.2A6.5 6.5 0 0 1 21.5 20",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z",
  cube: "M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9L12 2.8ZM3.8 7.7 12 12.3l8.2-4.6M12 12.3v8.6",
  at: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM16 8v5.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.6 7.2",
  scale: "M12 3.5v17M6 20.5h12M4 7.5h16M7 7.5l-3 7h6l-3-7ZM17 7.5l-3 7h6l-3-7Z",
  server:
    "M5.5 4h13A1.5 1.5 0 0 1 20 5.5v4a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 9.5v-4A1.5 1.5 0 0 1 5.5 4ZM5.5 13h13a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-4A1.5 1.5 0 0 1 5.5 13ZM8 7.5h.01M8 16.5h.01",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  moon: "M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z",
  menu: "M4 7h16M4 12h16M4 17h10",
  close: "M6 6l12 12M18 6 6 18",
  layers: "M12 3.5 21 8l-9 4.5L3 8l9-4.5ZM3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5",
  spark: "M12 3v5M12 16v5M3 12h5M16 12h5M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8",
  phone:
    "M6.6 3.5h2.6l1.3 4.2-1.9 1.5a11 11 0 0 0 6.2 6.2l1.5-1.9 4.2 1.3v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7.5V12l3 2",
  star: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8L12 3.5Z",
  mic: "M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3ZM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3",
  devices:
    "M3.5 5.5h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1ZM6.5 19.5h6M9.5 15.5v4M18.5 9.5h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z",
  smartphone: "M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5ZM11 18.5h2",
  poll: "M5 20.5V12M10 20.5V5M15 20.5v-6.5M20 20.5V9M3 20.5h18",
  smile: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8.5 14a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01",
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20, className }: { name: IconName | string; size?: number; className?: string }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
