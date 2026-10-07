import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";
import Icon from "./Icon";

const HEX = "0123456789abcdef";
const cipherOf = (text: string) =>
  [...text].map((ch) => (ch === " " ? " " : HEX[(Math.random() * 16) | 0])).join("");

/**
 * A chat bubble that alternates between what the server sees and what the recipient reads.
 *
 * Decorative: the whole thing is hidden from assistive technology, because a sentence that keeps
 * turning into hex is noise when read aloud. The point it makes is stated in the page's text.
 */
export default function CipherLoop({ messages, className }: { messages: string[]; className?: string }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(() => messages[0] ?? "");
  const [plain, setPlain] = useState(true);

  useEffect(() => {
    if (messages.length === 0) return;
    if (prefersReducedMotion()) {
      setShown(messages[0]);
      setPlain(true);
      return;
    }
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    let idx = 0;
    // A transition from `from` to `to`, letter by letter, at random moments within `ms`.
    const morph = (from: string, to: string, ms: number, done: () => void) => {
      const len = Math.max(from.length, to.length);
      const at = Array.from({ length: len }, () => Math.random() * ms);
      const t0 = performance.now();
      let lastFrame = 0;
      const step = (now: number) => {
        if (now - lastFrame > 40) {
          lastFrame = now;
          const dt = now - t0;
          let s = "";
          for (let k = 0; k < len; k++) s += dt >= at[k] ? (to[k] ?? "") : (from[k] ?? HEX[(Math.random() * 16) | 0]);
          setShown(s);
          if (dt >= ms) {
            setShown(to);
            done();
            return;
          }
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const cycle = () => {
      const text = messages[idx % messages.length];
      const hidden = cipherOf(text);
      timer = setTimeout(() => {
        setPlain(false);
        morph(text, hidden, 700, () => {
          timer = setTimeout(() => {
            idx += 1;
            setI(idx % messages.length);
            const nextText = messages[idx % messages.length];
            morph(hidden, nextText, 900, () => {
              setPlain(true);
              cycle();
            });
          }, 1400);
        });
      }, 2600);
    };
    setShown(messages[0]);
    cycle();
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [messages]);

  return (
    <div className={className ? `cipher-loop ${className}` : "cipher-loop"} data-plain={plain} data-i={i} aria-hidden="true">
      <span className="cipher-loop-lock">
        <Icon name={plain ? "unlock" : "lock"} size={14} />
      </span>
      <span className="cipher-loop-text">{shown}</span>
    </div>
  );
}
