import PageHero from "../components/PageHero";
import MailText from "../components/MailText";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import { photoCredits } from "../lib/photos";

interface Block {
  title: string;
  body: string;
}

/**
 * A legal notice is a list of details, set in a single panel at reading measure rather than full
 * width. Each detail is its own headed block, so a screen reader can jump from one to the next.
 * Photo credits are read from the photo registry, so the list names exactly the photographs the
 * site currently shows.
 */
export default function Impressum() {
  const { t, list } = useI18n();
  useSeo(t("meta.impressum.title"), t("meta.impressum.description"));
  const credits = photoCredits();

  return (
    <>
      <PageHero label={t("impressum.eyebrow")} title={t("impressum.title")} lead={t("impressum.subtitle")} compact />
      <section className="section">
        <div className="container">
          <div className="legal">
            {list<Block>("impressum.sections").map((s) => (
              <section className="legal-block" key={s.title}>
                <h2 className="legal-title">{s.title}</h2>
                {/* Addresses and multi-line details keep their own line breaks. */}
                <div className="legal-body"><MailText text={s.body} /></div>
              </section>
            ))}
            {credits.length > 0 && (
              <section className="legal-block">
                <h2 className="legal-title">{t("impressum.photos")}</h2>
                <div className="legal-body">
                  {t("impressum.photosBody")}
                  <ul className="credits">
                    {credits.map(({ slot, credit }) => (
                      <li key={slot}>
                        <a href={credit.url} rel="noreferrer noopener" target="_blank">
                          {credit.author}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
