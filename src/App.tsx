import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout, { worldOf } from "./components/Layout";
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
  const { pathname, hash } = useLocation();
  const last = useRef<string | null>(null);
  useEffect(() => {
    // A jump within the same page scrolls itself; only a new page is placed here.
    if (last.current === pathname) return;
    last.current = pathname;
    // A link to a section of another page lands on that section, anything else at the top.
    // Instant, not smooth: the page has changed, there is nothing to travel past.
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
    else window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

/**
 * Moving between pages draws the blade across the screen once — the home page's gesture, used as
 * the site's page transition. Not from the gate into a product: the gate sweeps on its own.
 */
function RouteWipe() {
  const { pathname } = useLocation();
  const prev = useRef(pathname);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = pathname;
    if (from === pathname || prefersReducedMotion()) return;
    if (from === "/" && (pathname === "/messenger" || pathname === "/helix")) return;
    setRun((n) => n + 1);
  }, [pathname]);
  if (!run) return null;
  return (
    <div key={run} className={`route-wipe wipe-${worldOf(pathname)}`} aria-hidden="true">
      <i />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <RouteWipe />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="/helix" element={<Helix />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/barrierefreiheit" element={<Accessibility />} />
          {/* /privacy is deliberately absent: it is served as a static, JS-free page from
              public/privacy/ and is linked with a plain <a>, so it stays readable even if this
              bundle never loads. public/datenschutz/ redirects there for links already in the
              wild — the Play Store listing among them. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}
