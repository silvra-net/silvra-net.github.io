import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import type { Lang } from "../i18n";
import { getTheme, resolvedTheme, setTheme } from "../theme";
import icon from "../assets/silvra-icon.png";
import type { ReactNode } from "react";

const PAGES = [
  { to: "/messenger", key: "nav.messenger" },
  { to: "/helix", key: "nav.helix" },
  { to: "/mission", key: "nav.mission" },
  { to: "/contact", key: "nav.contact" },
];

function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(() => resolvedTheme() === "dark");

  // Keep in step with the OS while the visitor has made no explicit choice.
  useEffect(() => {
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
      className="meta-btn"
      aria-label={t("nav.theme")}
      onClick={() => {
        const next = dark ? "light" : "dark";
        setTheme(next);
        setDark(next === "dark");
      }}
    >
      {dark ? "☾" : "☀"}
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
      {langs.map((l, i) => (
        <span key={l}>
          {i > 0 && <span className="lang-sep" aria-hidden="true">|</span>}
          <button
            type="button"
            className={l === lang ? "lang-btn active" : "lang-btn"}
            aria-current={l === lang}
            onClick={() => setLang(l)}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // A menu left open across a navigation covers the page it just moved to.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Nine tab stops separated a keyboard user from the content on every page. Visible only
          when focused, which is the point: it is there for the people who need it and invisible
          to everyone else. */}
      <a className="skip-link" href="#main">
        {t("nav.skip")}
      </a>

      <header className="site-header">
        {/* Meta row: what you set once and then forget — language, appearance, the explorer. */}
        <div className="meta-row">
          <div className="container meta-inner">
            <a className="meta-link" href="https://explorer.silvra.net/">
              {t("nav.explorer")}
            </a>
            <span className="meta-sep" aria-hidden="true" />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="container main-row">
          <Link to="/" className="brand" aria-label="Silvra">
            <img src={icon} alt="" />
            <span className="brand-name">Silvra</span>
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-label={open ? t("nav.close") : t("nav.open")}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>

          <nav className={open ? "site-nav open" : "site-nav"}>
            {PAGES.map((p) => (
              <NavLink
                key={p.to}
                to={p.to}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {t(p.key)}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* tabIndex -1 makes the target focusable so the jump actually moves focus;
          without it the browser scrolls and the next Tab returns to the header. */}
      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-cols">
            <div className="footer-col">
              <h2>Silvra</h2>
              <p style={{ margin: 0, maxWidth: "36ch" }}>{t("footer.description")}</p>
            </div>
            <div className="footer-col">
              <h2>{t("footer.pages")}</h2>
              <Link to="/mission">{t("nav.mission")}</Link>
              <Link to="/contact">{t("nav.contact")}</Link>
            </div>
            <div className="footer-col">
              <h2>{t("footer.products")}</h2>
              <Link to="/messenger">{t("nav.messenger")}</Link>
              <Link to="/helix">{t("nav.helix")}</Link>
              <a href="https://explorer.silvra.net/">{t("nav.explorer")}</a>
            </div>
            <div className="footer-col">
              <h2>{t("footer.legal")}</h2>
              <Link to="/impressum">Impressum</Link>
              {/* Plain anchor: the privacy policy is a static page, not a route. */}
              <a href="/privacy/">Datenschutz</a>
            </div>
          </div>
          <div className="footer-bottom">{t("footer.copyright", { year: new Date().getFullYear() })}</div>
        </div>
      </footer>
    </>
  );
}
