import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export interface TourStep {
  icon: string;
  kicker: string;
  title: string;
  body: string;
}

/**
 * The app, told in steps: the phone stays pinned while the text scrolls past it, and the screen
 * changes with the step being read. On a narrow screen there is no room to pin anything, so each
 * step simply carries its own screenshot.
 */
export default function AppTour({ steps, shots, alts }: { steps: TourStep[]; shots: string[]; alts: string[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      // A step counts as read while it crosses the middle band of the screen.
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [steps.length]);

  return (
    <div className="tour">
      <div className="tour-stage" aria-hidden="true">
        <div className="tour-phone">
          {shots.map((src, i) => (
            <img key={src} src={src} alt="" className={i === active ? "on" : ""} loading="lazy" width={600} height={1182} />
          ))}
        </div>
        <div className="tour-dots">
          {steps.map((s, i) => (
            <span key={s.title} className={i === active ? "on" : ""} />
          ))}
        </div>
      </div>
      <ol className="tour-steps">
        {steps.map((s, i) => (
          <li
            key={s.title}
            data-step={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={i === active ? "tour-step on" : "tour-step"}
          >
            <img className="tour-inline" src={shots[i]} alt={alts[i]} loading="lazy" width={600} height={1182} />
            <p className="tour-kicker mono">
              <Icon name={s.icon} size={16} />
              {s.kicker}
            </p>
            <h3>{s.title}</h3>
            <p className="muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
