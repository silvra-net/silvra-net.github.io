import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import { LANGS, counterpart, routeOf } from "../lib/routes";
import type { RouteKey } from "../lib/routes";
import { setTheme } from "../theme";
import Icon from "./Icon";
import EuMark from "./EuMark";
import BackToTop from "./BackToTop";
import { setMotionStill, useReducedMotion } from "../lib/motion";
import { DISCORD, EXPLORER, GITHUB } from "../lib/links";
import icon from "../assets/silvra-icon.png";
import type { ReactNode } from "react";
import NewTab from "./NewTab";

// The server has no layout to measure; there the plain effect stands in, silently.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Full-width openings and bands that stay night olive in both themes. While one of them is
 *  under the header, the header stays dark with it instead of turning into a paper strip. */
const DARK_BANDS = ".gate, .p-hero, .page-hero, .claim-band, .marquee-band, .next-world, .site-footer";

/** Everything the open phone menu covers. Made inert, so neither Tab nor a screen reader's
 *  virtual cursor can wander into a page the visitor cannot see. */
const BEHIND_MENU = ".skip-link, #main, .site-footer, .to-top, .sticky-cta";

const PAGES: { page: RouteKey; key: string; world?: "messenger" | "helix" }[] = [
  { page: "messenger", key: "nav.messenger", world: "messenger" },
  { page: "helix", key: "nav.helix", world: "helix" },
  { page: "mission", key: "nav.mission" },
  { page: "contact", key: "nav.contact" },
];

/** Which world a path belongs to, in either language. The two product pages carry their own
 *  colour; the rest is Silvra. Only the pages themselves, not every path below them: Pages
 *  answers /helix/xyz with 404.html, which is rendered as Silvra and must hydrate as Silvra. */
export function worldOf(pathname: string): "messenger" | "helix" | "silvra" {
  const key = routeOf(pathname)?.route.key;
  return key === "messenger" || key === "helix" ? key : "silvra";
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
          {/* Shown, not read: the row's name already says which way it switches. */}
          <span className="motion-state mono" aria-hidden="true">
            {dark ? t("nav.themeIsDark") : t("nav.themeIsLight")}
          </span>
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
          {/* Shown, not read: the pressed state already says it. */}
          <span className="motion-state mono" aria-hidden="true">
            {pressed ? t("nav.motionPaused") : t("nav.motionRunning")}
          </span>
        </>
      )}
    </button>
  );
}

/**
 * Both languages side by side, current one marked — rather than a control showing the other one.
 * Each is a link to this same page in that language, so it works without JavaScript, and a
 * search engine sees the two versions linked to each other. Choosing one also stores it, so the
 * head script never sends the visitor back to the language they just left. The head script
 * (scripts/lang-script.mjs) does the storing, for every link in a .lang group, so it holds before
 * the app has loaded and on the static privacy pages too.
 */
function LanguageSwitcher() {
  const { lang, t } = useI18n();
  const { pathname, hash } = useLocation();
  // The section the reader is at goes along, but only once the page runs: the prerendered markup
  // knows no hash, and hydration would keep its link without one anyway.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="lang" role="group" aria-label={t("nav.switchLang")}>
      {LANGS.map((l) => (
        <Link
          key={l}
          to={counterpart(pathname, l) + (ready ? hash : "")}
          className={l === lang ? "lang-btn active" : "lang-btn"}
          // Spoken in its own language, its name starting with the code on screen (WCAG 2.5.3).
          lang={l}
          hrefLang={l}
          aria-label={`${l.toUpperCase()} – ${l === "de" ? "Deutsch" : "English"}`}
          aria-current={l === lang ? "true" : undefined}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t, path } = useI18n();
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
  // close it, Tab must cycle through the menu and the header above it (the language pair and the
  // menu button stay there, in sight), and focus must go into it and come back to the button
  // afterwards.
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
      const focusable = "a[href], button:not([disabled])";
      // Only what is on screen: the header hides its wide-screen links and buttons on a phone.
      const items = [
        ...(btn?.closest("header")?.querySelectorAll<HTMLElement>(focusable) ?? []),
        ...menu.current.querySelectorAll<HTMLElement>(focusable),
      ].filter((el) => el.getClientRects().length > 0);
      const first = items[0];
      const last = items[items.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    // Above the phone breakpoint the menu button is gone; a menu still open after the window is
    // widened or a tablet turned would cover the page with no visible way out.
    const wide = window.matchMedia("(min-width: 1021px)");
    const onWide = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      release();
      if (closedByRoute.current) closedByRoute.current = false;
      else btn?.focus();
    };
  }, [open]);

  const privacy = path("privacy");

  // The year the page is read in, not only the year it was built: the prerendered markup carries
  // the build year (so hydration matches), and the visitor's clock takes over right after.
  const [year, setYear] = useState(__BUILD_YEAR__);
  useEffect(() => setYear(new Date().getFullYear()), []);

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
          <Link to={path("home")} className="brand">
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
            <span className="sr-only">{t("common.sep")}{t("nav.home")}</span>
          </Link>

          <nav className="site-nav" aria-label={t("nav.main")}>
            {PAGES.map((p) => (
              // `end`: the pages have no pages below them, and /helix/xyz is the not-found page,
              // which marks no link as current.
              <NavLink
                key={p.page}
                to={path(p.page)}
                end
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
          <NavLink to={path("messenger")} end className="mobile-world mobile-messenger">
            <span className="mobile-index">01</span>
            <span className="mobile-title">Silvra Messenger</span>
            <span className="mobile-tag">{t("nav.messengerTag")}</span>
          </NavLink>
          <NavLink to={path("helix")} end className="mobile-world mobile-helix">
            <span className="mobile-index">02</span>
            <span className="mobile-title">{t("nav.helixFull")}</span>
            <span className="mobile-tag">{t("nav.helixTag")}</span>
          </NavLink>
          <div className="mobile-links">
            <NavLink to={path("home")} end>
              {t("nav.home")}
            </NavLink>
            <NavLink to={path("mission")} end>
              {t("nav.mission")}
            </NavLink>
            <NavLink to={path("contact")} end>
              {t("nav.contact")}
            </NavLink>
            <a href={EXPLORER}>
              {t("nav.explorer")} <Icon name="arrowUpRight" size={14} />
            </a>
          </div>
          <MotionToggle labelled />
          <ThemeToggle labelled />
          <p className="mobile-legal mono">
            <Link to={path("impressum")}>{t("footer.impressum")}</Link>
            <a href={privacy}>{t("footer.privacy")}</a>
            <Link to={path("accessibility")}>{t("footer.accessibility")}</Link>
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
              <Link to={path("home")} className="brand">
                <img src={icon} alt="" width={30} height={30} />
                <span className="brand-name">Silvra</span>
                <span className="sr-only">{t("common.sep")}{t("nav.home")}</span>
              </Link>
              <p>{t("footer.description")}</p>
              <p className="footer-eu">
                <EuMark />
                {t("footer.eu")}
              </p>
              {/* The look borrows from military and cyber units; the line says plainly that the
                  project is not one, where people look for who is behind a site. */}
              <p className="footer-independent mono">{t("footer.independent")}</p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h2>{t("footer.products")}</h2>
                <Link to={path("messenger")}>Silvra Messenger</Link>
                <Link to={path("helix")}>{t("nav.helixFull")}</Link>
                <a href={EXPLORER}>
                  Helix {t("nav.explorer")}
                  <Icon name="arrowUpRight" size={12} />
                </a>
              </div>
              <div className="footer-col">
                <h2>Silvra</h2>
                <Link to={path("mission")}>{t("nav.mission")}</Link>
                <Link to={path("contact")}>{t("nav.contact")}</Link>
                <a href={GITHUB} rel="noreferrer noopener" target="_blank">
                  GitHub
                  <NewTab />
                  <Icon name="arrowUpRight" size={12} />
                </a>
                <a href={DISCORD} rel="noreferrer noopener" target="_blank">
                  Discord
                  <NewTab />
                  <Icon name="arrowUpRight" size={12} />
                </a>
              </div>
              <div className="footer-col">
                <h2>{t("footer.legal")}</h2>
                <Link to={path("impressum")}>{t("footer.impressum")}</Link>
                {/* Plain anchor: the privacy policy is a static page, not a route. */}
                <a href={privacy}>{t("footer.privacy")}</a>
                <Link to={path("accessibility")}>{t("footer.accessibility")}</Link>
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
            <span>{t("footer.copyright", { year })}</span>
            <span className="mono">{t("footer.stack")}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
