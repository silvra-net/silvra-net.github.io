import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import type { Lang } from "../i18n";
import { setTheme } from "../theme";
import Icon from "./Icon";
import EuMark from "./EuMark";
import BackToTop from "./BackToTop";
import { setMotionStill, useReducedMotion } from "../lib/motion";
import { DISCORD, EXPLORER, GITHUB } from "../lib/links";
import icon from "../assets/silvra-icon.png";
import type { ReactNode } from "react";

// The server has no layout to measure; there the plain effect stands in, silently.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Full-width openings and bands that stay night olive in both themes. While one of them is
 *  under the header, the header stays dark with it instead of turning into a paper strip. */
const DARK_BANDS = ".gate, .p-hero, .page-hero, .claim-band, .next-world, .site-footer";

/** Everything the open phone menu covers. Made inert, so neither Tab nor a screen reader's
 *  virtual cursor can wander into a page the visitor cannot see. */
const BEHIND_MENU = ".skip-link, #main, .site-footer, .to-top, .sticky-cta";

const PAGES = [
  { to: "/messenger", key: "nav.messenger", world: "messenger" },
  { to: "/helix", key: "nav.helix", world: "helix" },
  { to: "/mission", key: "nav.mission" },
  { to: "/contact", key: "nav.contact" },
];

/** Which world a path belongs to. The two product pages carry their own colour; the rest is Silvra. */
export function worldOf(pathname: string): "messenger" | "helix" | "silvra" {
  if (pathname.startsWith("/messenger")) return "messenger";
  if (pathname.startsWith("/helix")) return "helix";
  return "silvra";
}

/** Whether the page is dark right now: the explicit choice on <html> if there is one, the OS
 *  otherwise. Read from the page itself, so the header button and the one in the phone menu
 *  always agree, whichever of them was pressed. Dark on the first render, as the prerendered
 *  page has it; the real theme right after. */
function useDarkTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const read = () => {
      const chosen = root.getAttribute("data-theme");
      setDark(chosen ? chosen === "dark" : !mq.matches);
    };
    read();
    const watch = new MutationObserver(read);
    watch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    mq.addEventListener("change", read);
    return () => {
      watch.disconnect();
      mq.removeEventListener("change", read);
    };
  }, []);
  return dark;
}

/**
 * Named for what it does next ("switch to light design"), not for the state it shows: a button
 * called "theme" tells nobody which way it will go. In the phone menu it is a labelled row with
 * the current state beside it, like the motion switch.
 */
function ThemeToggle({ labelled = false }: { labelled?: boolean }) {
  const { t } = useI18n();
  const dark = useDarkTheme();
  const action = dark ? t("nav.themeLight") : t("nav.themeDark");
  return (
    <button
      type="button"
      className={labelled ? "motion-row theme-row" : "icon-btn theme-toggle"}
      aria-label={labelled ? undefined : action}
      title={labelled ? undefined : action}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <Icon name={dark ? "moon" : "sun"} size={16} />
      {labelled && (
        <>
          <span>{action}</span>
          <span className="motion-state mono">{dark ? t("nav.themeIsDark") : t("nav.themeIsLight")}</span>
        </>
      )}
    </button>
  );
}

/**
 * "Bewegung anhalten": stops every animation and every self-updating number on the site, as WCAG
 * 2.2.2 asks. A toggle button, so its name stays the same and its state is the pressed state.
 * Unpressed on the first render, as the prerendered page has it; the real state right after.
 */
function MotionToggle({ labelled = false }: { labelled?: boolean }) {
  const { t } = useI18n();
  const still = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const pressed = ready && still;
  return (
    <button
      type="button"
      className={labelled ? "motion-row" : "icon-btn motion-toggle"}
      aria-pressed={pressed}
      aria-label={labelled ? undefined : t("nav.motion")}
      title={labelled ? undefined : t("nav.motion")}
      onClick={() => setMotionStill(!still)}
    >
      <Icon name={pressed ? "play" : "pause"} size={16} />
      {labelled && (
        <>
          <span>{t("nav.motion")}</span>
          <span className="motion-state mono">{pressed ? t("nav.motionPaused") : t("nav.motionRunning")}</span>
        </>
      )}
    </button>
  );
}

/**
 * Both languages side by side, current one marked — rather than a button showing the other one.
 * A toggle labelled "EN" is ambiguous about whether that is the state or the action; two labels
 * with one of them active is not.
 */
function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const langs: Lang[] = ["de", "en"];
  return (
    <div className="lang" role="group" aria-label={t("nav.switchLang")}>
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          className={l === lang ? "lang-btn active" : "lang-btn"}
          aria-current={l === lang}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overDark, setOverDark] = useState(true);
  const { pathname } = useLocation();
  const world = worldOf(pathname);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const held = useRef<HTMLElement[]>([]);
  const closedByRoute = useRef(false);
  const release = () => {
    held.current.forEach((el) => el.removeAttribute("inert"));
    held.current = [];
  };

  // A menu left open across a navigation covers the page it just moved to. The page is released
  // before any passive effect runs, so the new page can take focus on its heading (App.tsx), and
  // the menu then leaves focus there instead of pulling it back to its button.
  useIsoLayoutEffect(() => {
    if (held.current.length) {
      release();
      closedByRoute.current = true;
    }
    setOpen(false);
  }, [pathname]);

  // The world colours everything from the header down, so it lives on the root element.
  useEffect(() => {
    document.documentElement.dataset.world = world;
  }, [world]);

  // Transparent over the opening of a page, solid once the page has moved under it; and a
  // hairline along the header's lower edge that fills as the page is read.
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current?.style.setProperty("transform", `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`);
    };
    const on = () => {
      setScrolled(window.scrollY > 24);
      if (!raf) raf = requestAnimationFrame(paint);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // Which band is under the header: the observed strip is the header's own height at the top
  // of the viewport, rebuilt when the viewport changes height.
  useEffect(() => {
    const under = new Set<Element>();
    let io: IntersectionObserver | null = null;
    let timer = 0;
    const build = () => {
      io?.disconnect();
      under.clear();
      const h = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) under.add(e.target);
            else under.delete(e.target);
          }
          setOverDark(under.size > 0);
        },
        { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - h)}px 0px` },
      );
      document.querySelectorAll(DARK_BANDS).forEach((el) => io?.observe(el));
    };
    const onResize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(build, 150);
    };
    build();
    window.addEventListener("resize", onResize);
    return () => {
      io?.disconnect();
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  // The open menu covers the page: the page must not scroll under it or take focus, Escape must
  // close it, Tab must cycle between the menu and its button, and focus must go into it and come
  // back to the button afterwards.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Only what is not inert already: the hidden sticky bar manages its own, and must keep it.
    held.current = [...document.querySelectorAll<HTMLElement>(BEHIND_MENU)].filter((el) => !el.hasAttribute("inert"));
    held.current.forEach((el) => el.setAttribute("inert", ""));
    menu.current?.querySelector<HTMLElement>("a, button")?.focus();
    const btn = toggle.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !menu.current) return;
      const items = menu.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      const last = items[items.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        btn?.focus();
      } else if (e.shiftKey && document.activeElement === btn) {
        e.preventDefault();
        last?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      release();
      if (closedByRoute.current) closedByRoute.current = false;
      else btn?.focus();
    };
  }, [open]);

  const privacy = lang === "en" ? "/privacy/#en" : "/privacy/";

  return (
    <>
      {/* Visible only when focused: there for the people who need it, invisible to everyone else. */}
      <a className="skip-link" href="#main">
        {t("nav.skip")}
      </a>

      {/* Opaque once the page moves under it; night olive over the dark bands, paper elsewhere in
          the light theme, and paper while the (paper) phone menu is open. */}
      <header
        className={`site-header${scrolled || open ? " is-solid" : ""}${overDark && !open ? " dark-zone" : ""}${open ? " is-open" : ""}`}
      >
        <div className="container header-row">
          <Link to="/" className="brand">
            <img src={icon} alt="" width={30} height={30} />
            <span className="brand-name">Silvra</span>
            {world !== "silvra" && (
              <span className={`brand-world brand-${world}`}>
                <span className="brand-slash" aria-hidden="true">
                  /
                </span>
                {t(`nav.${world}`)}
              </span>
            )}
            <span className="sr-only"> — {t("nav.home")}</span>
          </Link>

          <nav className="site-nav" aria-label={t("nav.main")}>
            {PAGES.map((p) => (
              <NavLink
                key={p.to}
                to={p.to}
                className={({ isActive }) =>
                  `nav-link${p.world ? ` nav-${p.world}` : ""}${isActive ? " active" : ""}`
                }
              >
                {t(p.key)}
              </NavLink>
            ))}
          </nav>

          <div className="header-tools">
            <a className="explorer-link" href={EXPLORER}>
              {t("nav.explorer")}
              <Icon name="arrowUpRight" size={14} />
            </a>
            <LanguageSwitcher />
            <MotionToggle />
            <ThemeToggle />
            <button
              ref={toggle}
              type="button"
              className="icon-btn nav-toggle"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t("nav.close") : t("nav.open")}
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name={open ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>
        <div className="scroll-progress" ref={progress} aria-hidden="true" />
      </header>

      <div id="mobile-menu" ref={menu} className={open ? "mobile-menu open" : "mobile-menu"} hidden={!open}>
        <nav className="mobile-nav" aria-label={t("nav.main")}>
          <NavLink to="/messenger" className="mobile-world mobile-messenger">
            <span className="mobile-index">01</span>
            <span className="mobile-title">Silvra Messenger</span>
            <span className="mobile-tag">{t("nav.messengerTag")}</span>
          </NavLink>
          <NavLink to="/helix" className="mobile-world mobile-helix">
            <span className="mobile-index">02</span>
            <span className="mobile-title">Helix Blockchain</span>
            <span className="mobile-tag">{t("nav.helixTag")}</span>
          </NavLink>
          <div className="mobile-links">
            <NavLink to="/" end>
              {t("nav.home")}
            </NavLink>
            <NavLink to="/mission">{t("nav.mission")}</NavLink>
            <NavLink to="/contact">{t("nav.contact")}</NavLink>
            <a href={EXPLORER}>
              {t("nav.explorer")} <Icon name="arrowUpRight" size={14} />
            </a>
          </div>
          <MotionToggle labelled />
          <ThemeToggle labelled />
          <p className="mobile-legal mono">
            <Link to="/impressum">{t("footer.impressum")}</Link>
            <a href={privacy}>{t("footer.privacy")}</a>
            <Link to="/barrierefreiheit">{t("footer.accessibility")}</Link>
          </p>
        </nav>
      </div>

      {/* tabIndex -1 makes the target focusable so the skip link actually moves focus. */}
      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <BackToTop />

      <div className="camo-frame" aria-hidden="true">
        <i />
        <i />
      </div>

      <footer className="site-footer dark-zone">
        <div className="container">
          <div className="footer-top">
            <div className="footer-intro">
              <Link to="/" className="brand">
                <img src={icon} alt="" width={30} height={30} />
                <span className="brand-name">Silvra</span>
                <span className="sr-only"> — {t("nav.home")}</span>
              </Link>
              <p>{t("footer.description")}</p>
              <p className="footer-eu">
                <EuMark />
                {t("footer.eu")}
              </p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h2>{t("footer.products")}</h2>
                <Link to="/messenger">Silvra Messenger</Link>
                <Link to="/helix">Helix Blockchain</Link>
                <a href={EXPLORER}>
                  Helix {t("nav.explorer")}
                  <Icon name="arrowUpRight" size={12} />
                </a>
              </div>
              <div className="footer-col">
                <h2>Silvra</h2>
                <Link to="/mission">{t("nav.mission")}</Link>
                <Link to="/contact">{t("nav.contact")}</Link>
                <a href={GITHUB} rel="noreferrer noopener" target="_blank">
                  GitHub
                  <span className="sr-only">{t("footer.newTab")}</span>
                  <Icon name="arrowUpRight" size={12} />
                </a>
                <a href={DISCORD} rel="noreferrer noopener" target="_blank">
                  Discord
                  <span className="sr-only">{t("footer.newTab")}</span>
                  <Icon name="arrowUpRight" size={12} />
                </a>
              </div>
              <div className="footer-col">
                <h2>{t("footer.legal")}</h2>
                <Link to="/impressum">{t("footer.impressum")}</Link>
                {/* Plain anchor: the privacy policy is a static page, not a route. Both languages
                    live on it; the English reader lands on the English half. */}
                <a href={privacy}>{t("footer.privacy")}</a>
                <Link to="/barrierefreiheit">{t("footer.accessibility")}</Link>
                <a href={`mailto:info@silvra.net?subject=${encodeURIComponent(t("footer.reportBarrier"))}`}>
                  {t("footer.reportBarrier")}
                </a>
              </div>
            </div>
          </div>
          <div className="footer-mark" aria-hidden="true">
            SILVRA
          </div>
          <div className="footer-bottom">
            <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
            <span className="mono">{t("footer.stack")}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
