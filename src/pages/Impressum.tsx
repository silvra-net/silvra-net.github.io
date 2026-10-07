import PageHero from "../components/PageHero";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";
import { photoCredits } from "../lib/photos";

interface Block {
  title: string;
  body: string;
}

/**
 * A legal notice is a list of details, so it is set as one: a single panel, label above value,
 * at reading measure rather than full width. Photo credits are read from the photo registry, so
 * the list names exactly the photographs the site currently shows.
 */
export default function Impressum() {
  const { t, list } = useI18n();
  useSeo(t("meta.impressum.title"), t("meta.impressum.description"));
  const credits = photoCredits();

  return (
    <>
      <PageHero label={t("impressum.eyebrow")} title={t("impressum.title")} lead={t("impressum.subtitle")} />
      <section className="section">
        <div className="container">
          <dl className="legal">
            {list<Block>("impressum.sections").map((s) => (
              <div key={s.title}>
                <dt>{s.title}</dt>
                {/* Addresses and multi-line details keep their own line breaks. */}
                <dd>{s.body}</dd>
              </div>
            ))}
            {credits.length > 0 && (
              <div>
                <dt>{t("impressum.photos")}</dt>
                <dd>
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
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    </>
  );
}
