import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import type { Lang } from "../i18n";
import { getTheme, resolvedTheme, setTheme } from "../theme";
import Icon from "./Icon";
import BackToTop from "./BackToTop";
import { useCursorEffects } from "../lib/cursor";
import { DISCORD, EXPLORER, GITHUB } from "../lib/links";
import icon from "../assets/silvra-icon.png";
import type { ReactNode } from "react";


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

function ThemeToggle() {
  const { t } = useI18n();
  // Dark on the first render, as the prerendered page has it; the real theme right after.
  const [dark, setDark] = useState(true);

  // Keep in step with the OS while the visitor has made no explicit choice.
  useEffect(() => {
    setDark(resolvedTheme() === "dark");
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (getTheme() === null) setDark(resolvedTheme() === "dark");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={t("nav.theme")}
      onClick={() => {
        const next = dark ? "light" : "dark";
        setTheme(next);
        setDark(next === "dark");
      }}
    >
      <Icon name={dark ? "moon" : "sun"} size={16} />
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
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const world = worldOf(pathname);
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  useCursorEffects();

  // A menu left open across a navigation covers the page it just moved to.
  useEffect(() => setOpen(false), [pathname]);

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

  // The open menu covers the page: the page must not scroll under it, Escape must close it,
  // and focus must go into it and come back to the button afterwards.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menu.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const btn = toggle.current;
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      btn?.focus();
    };
  }, [open]);

  return (
    <>
      {/* Visible only when focused: there for the people who need it, invisible to everyone else. */}
      <a className="skip-link" href="#main">
        {t("nav.skip")}
      </a>

      <header className={`site-header${scrolled || open ? " is-solid" : " dark-zone"}${open ? " is-open" : ""}`}>
        <div className="container header-row">
          <Link to="/" className="brand" aria-label={t("nav.home")}>
            <img src={icon} alt="" width={30} height={30} />
            <span className="brand-name">Silvra</span>
            {world !== "silvra" && (
              <span className={`brand-world brand-${world}`} aria-hidden="true">
                <span className="brand-slash">/</span>
                {t(`nav.${world}`)}
              </span>
            )}
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
          <Link to="/messenger" className="mobile-world mobile-messenger">
            <span className="mobile-index">01</span>
            <span className="mobile-title">Silvra Messenger</span>
            <span className="mobile-tag">{t("nav.messengerTag")}</span>
          </Link>
          <Link to="/helix" className="mobile-world mobile-helix">
            <span className="mobile-index">02</span>
            <span className="mobile-title">Helix Blockchain</span>
            <span className="mobile-tag">{t("nav.helixTag")}</span>
          </Link>
          <div className="mobile-links">
            <Link to="/">{t("nav.home")}</Link>
            <Link to="/mission">{t("nav.mission")}</Link>
            <Link to="/contact">{t("nav.contact")}</Link>
            <a href={EXPLORER}>
              {t("nav.explorer")} <Icon name="arrowUpRight" size={14} />
            </a>
          </div>
        </nav>
      </div>

      {/* tabIndex -1 makes the target focusable so the skip link actually moves focus. */}
      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <BackToTop />

      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-intro">
              <Link to="/" className="brand" aria-label={t("nav.home")}>
                <img src={icon} alt="" width={30} height={30} />
                <span className="brand-name">Silvra</span>
              </Link>
              <p>{t("footer.description")}</p>
              <p className="footer-eu">
                <span className="eu-dots" aria-hidden="true" />
                {t("footer.eu")}
              </p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h2>{t("footer.products")}</h2>
                <Link to="/messenger">Silvra Messenger</Link>
                <Link to="/helix">Helix Blockchain</Link>
                <a href={EXPLORER}>Helix {t("nav.explorer")}</a>
              </div>
              <div className="footer-col">
                <h2>Silvra</h2>
                <Link to="/mission">{t("nav.mission")}</Link>
                <Link to="/contact">{t("nav.contact")}</Link>
                <a href={GITHUB} rel="noreferrer noopener" target="_blank">
                  GitHub
                </a>
                <a href={DISCORD} rel="noreferrer noopener" target="_blank">
                  Discord
                </a>
              </div>
              <div className="footer-col">
                <h2>{t("footer.legal")}</h2>
                <Link to="/impressum">{t("footer.impressum")}</Link>
                {/* Plain anchor: the privacy policy is a static page, not a route. */}
                <a href="/privacy/">{t("footer.privacy")}</a>
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
