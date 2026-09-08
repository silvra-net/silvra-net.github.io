import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import type { Lang } from "../i18n";
import { getTheme, resolvedTheme, setTheme } from "../theme";
import logo from "../assets/logo-header.png";
import type { ReactNode } from "react";

const PAGES = [
  { to: "/messenger", key: "nav.messenger" },
  { to: "/helix", key: "nav.helix" },
  { to: "/mission", key: "nav.mission" },
  { to: "/kontakt", key: "nav.contact" },
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
      className="btn"
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

function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const other: Lang = lang === "de" ? "en" : "de";
  return (
    <button type="button" className="btn" onClick={() => setLang(other)} aria-label={t("nav.switchLang")}>
      {other.toUpperCase()}
    </button>
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
      <header className="site-header">
        <div className="container inner">
          <Link to="/" className="brand">
            <img src={logo} alt="Silvra" />
          </Link>

          <button
            type="button"
            className="btn nav-toggle"
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
            <a className="nav-link" href="/explorer/">
              {t("nav.explorer")}
            </a>
            <LanguageSwitcher />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Silvra</h4>
              <p style={{ margin: 0, maxWidth: "36ch" }}>{t("footer.description")}</p>
            </div>
            <div className="footer-col">
              <h4>{t("footer.pages")}</h4>
              <Link to="/mission">{t("nav.mission")}</Link>
              <Link to="/kontakt">{t("nav.contact")}</Link>
            </div>
            <div className="footer-col">
              <h4>{t("footer.products")}</h4>
              <Link to="/messenger">{t("nav.messenger")}</Link>
              <Link to="/helix">{t("nav.helix")}</Link>
              <a href="/explorer/">{t("nav.explorer")}</a>
            </div>
            <div className="footer-col">
              <h4>{t("footer.legal")}</h4>
              <Link to="/impressum">Impressum</Link>
              {/* Plain anchor: the privacy policy is a static page, not a route. */}
              <a href="/datenschutz/">Datenschutz</a>
            </div>
          </div>
          <div className="footer-bottom">{t("footer.copyright", { year: new Date().getFullYear() })}</div>
        </div>
      </footer>
    </>
  );
}
