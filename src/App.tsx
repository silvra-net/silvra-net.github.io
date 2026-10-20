import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout, { worldOf } from "./components/Layout";
import { APP_ROUTES, LANGS, pagePath, routeOf } from "./lib/routes";
import type { RouteKey } from "./lib/routes";
import { prefersReducedMotion } from "./lib/motion";
import Home from "./pages/Home";
import Messenger from "./pages/Messenger";
import Helix from "./pages/Helix";
import Mission from "./pages/Mission";
import Contact from "./pages/Contact";
import Impressum from "./pages/Impressum";
import Accessibility from "./pages/Accessibility";
import NotFound from "./pages/NotFound";

/** A client router leaves the scroll position where the last page left it; a new page should
 *  start at the top, the way a real navigation does. */
function ScrollToTop() {
  const { pathname: raw, hash } = useLocation();
  const pathname = pagePath(raw);
  const last = useRef<string | null>(null);
  useEffect(() => {
    // A jump within the same page scrolls itself; only a new page is placed here. The language
    // switch leads to the same page in the other language: the reader stays where they were.
    if (last.current === pathname) return;
    const first = last.current === null;
    const from = last.current === null ? undefined : routeOf(last.current);
    last.current = pathname;
    if (from && from.route === routeOf(pathname)?.route) return;
    // A link to a section of another page lands on that section, anything else at the top.
    // Instant, not smooth: the page has changed, there is nothing to travel past.
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
    else window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    // After a navigation inside the site, focus starts on the new page's heading, as it would
    // after a real page load, instead of staying on a link that no longer exists. Not on the
    // first load: there the browser's own focus handling is already right.
    if (first || target) return;
    const h1 = document.querySelector<HTMLElement>("main h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    }
  }, [pathname, hash]);
  return null;
}

/**
 * Moving between pages draws the blade across the screen once — the home page's gesture, used as
 * the site's page transition. Not from the gate into a product: the gate sweeps on its own. Not
 * for a change of language either: the page stays, only its words change.
 */
function RouteWipe() {
  const pathname = pagePath(useLocation().pathname);
  const prev = useRef(pathname);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = pathname;
    if (from === pathname || prefersReducedMotion()) return;
    const a = routeOf(from)?.route.key;
    const b = routeOf(pathname)?.route.key;
    if (a && a === b) return;
    if (a === "home" && (b === "messenger" || b === "helix")) return;
    setRun((n) => n + 1);
  }, [pathname]);
  if (!run) return null;
  return (
    <div key={run} className={`route-wipe wipe-${worldOf(pathname)}`} aria-hidden="true">
      <i />
    </div>
  );
}

const PAGES: Record<Exclude<RouteKey, "privacy">, ReactElement> = {
  home: <Home />,
  messenger: <Messenger />,
  helix: <Helix />,
  mission: <Mission />,
  contact: <Contact />,
  impressum: <Impressum />,
  accessibility: <Accessibility />,
};

export default function App() {
  return (
    <>
      <ScrollToTop />
      <RouteWipe />
      <Layout>
        <Routes>
          {/* Each page at its German and its English address, from src/routes.json. /privacy is
              deliberately absent: it is a static, JS-free page built from public/privacy/ and
              linked with a plain <a>, so it stays readable even if this bundle never loads.
              public/datenschutz/ redirects there for links already in the wild — the Play Store
              listing among them. */}
          {APP_ROUTES.flatMap((r) =>
            LANGS.map((l) => <Route key={r[l]} path={r[l]} element={PAGES[r.key as keyof typeof PAGES]} />),
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}
