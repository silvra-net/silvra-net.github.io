import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useI18n } from "../i18n";
import { prefersReducedMotion } from "../lib/motion";

const HEX = "0123456789abcdef";
const noise = (n: number) =>
  Array.from({ length: n }, (_, i) => (i % 5 === 4 ? " " : HEX[(Math.random() * 16) | 0])).join("");

interface Stop {
  who: string;
  title: string;
  body: string;
}

/**
 * The route a message takes, told as three stops: the sender's phone, the server in between,
 * the recipient's phone. A packet travels the line between them; the two ends show the message
 * and the middle shows what the server holds, which is noise — fresh noise every pass, because
 * every message is encrypted anew.
 */
export default function MessageJourney() {
  const { t, list } = useI18n();
  const stops = list<Stop>("messenger.journey.stops");
  const message = t("messenger.journey.message");
  const [cipher, setCipher] = useState("9f3a c1e0 77b2 d4e8 91af 5c2d 08be 6f13 2a");

  useEffect(() => {
    setCipher(noise(44));
    if (prefersReducedMotion()) return;
    // One pass of the packet is 5.2 s (see .journey-packet); the server's copy changes with it.
    const id = setInterval(() => setCipher(noise(44)), 5200);
    return () => clearInterval(id);
  }, []);

  const views = [
    <p className="journey-bubble mine" key="a">
      {message}
    </p>,
    <p className="journey-bubble cipher mono" key="s">
      <span className="sr-only">{t("messenger.journey.cipherAria")}</span>
      <span aria-hidden="true">{cipher}</span>
    </p>,
    <p className="journey-bubble theirs" key="b">
      {message}
    </p>,
  ];
  const icons = ["smartphone", "server", "smartphone"];

  return (
    <div className="journey">
      <div className="journey-track" aria-hidden="true">
        <span className="journey-packet">
          <Icon name="lock" size={12} />
        </span>
      </div>
      <ol className="journey-stops">
        {stops.map((s, i) => (
          <li key={s.who} className={`journey-stop stop-${i}`}>
            <span className="journey-node">
              <Icon name={icons[i]} size={22} />
            </span>
            <p className="journey-who mono">{s.who}</p>
            {views[i]}
            <h3>{s.title}</h3>
            <p className="muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
