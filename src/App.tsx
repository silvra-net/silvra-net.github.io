import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Messenger from "./pages/Messenger";
import Helix from "./pages/Helix";
import Mission from "./pages/Mission";
import Contact from "./pages/Contact";
import Impressum from "./pages/Impressum";
import NotFound from "./pages/NotFound";

/** A client router leaves the scroll position where the last page left it; a new page should
 *  start at the top, the way a real navigation does. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="/helix" element={<Helix />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/kontakt" element={<Contact />} />
          <Route path="/impressum" element={<Impressum />} />
          {/* /datenschutz is deliberately absent: it is served as a static, JS-free page from
              public/datenschutz/ and is linked with a plain <a>, so it stays readable even if
              this bundle never loads. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}
