import { createContext, useContext } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import Scramble from "../components/Scramble";
import Icon from "../components/Icon";
import { phrase, useI18n } from "../i18n";
import type { Lang } from "../i18n";
import { pathFor } from "../lib/routes";
import { useSeo } from "../lib/seo";

/**
 * True only while the build renders 404.html (src/entry-server.tsx). GitHub Pages answers every
 * unknown address with that one file, and without JavaScript nothing can tell whether the address
 * was under /en/; so the file says everything twice, in German and in English, each with its own
 * ways back. With JavaScript the page is drawn again in the one language the visitor reads
 * (src/main.tsx), and this stays false.
 */
export const BothLanguages = createContext(false);

function WaysBack({ lang }: { lang: Lang }) {
  return (
    <div className="btn-row">
      <Link className="btn primary" to={pathFor("home", lang)}>
        {phrase(lang, "notFound.cta")}
        <Icon name="arrowRight" size={16} />
      </Link>
      <Link className="btn" to={pathFor("messenger", lang)}>
        Silvra Messenger
      </Link>
      <Link className="btn" to={pathFor("helix", lang)}>
        {phrase(lang, "nav.helixFull")}
      </Link>
    </div>
  );
}

export default function NotFound() {
  const { t, lang } = useI18n();
  const both = useContext(BothLanguages);
  useSeo(t("meta.notFound.title"), t("meta.notFound.description"));

  if (both) {
    return (
      <PageHero
        label="404"
        title={
          <>
            {phrase("de", "notFound.title")}
            {/* The space keeps the two lines apart for anything that reads the heading as text. */}
            <span className="nf-alt" lang="en">{` ${phrase("en", "notFound.title")}`}</span>
          </>
        }
        compact
        last
      >
        <div className="nf-both">
          {(["de", "en"] as const).map((l) => (
            <div key={l} className="nf-lang" lang={l}>
              <p className="nf-tag">{l === "de" ? "Deutsch" : "English"}</p>
              <p className="lead">{phrase(l, "notFound.body")}</p>
              <WaysBack lang={l} />
            </div>
          ))}
        </div>
      </PageHero>
    );
  }

  return (
    <PageHero label="404" title={<Scramble text={t("notFound.title")} />} lead={t("notFound.body")} compact last>
      <WaysBack lang={lang} />
    </PageHero>
  );
}
