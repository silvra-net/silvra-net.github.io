import { Link } from "react-router-dom";
import Section from "../components/Section";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

export default function NotFound() {
  const { t } = useI18n();
  useSeo(t("meta.notFound.title"), t("meta.notFound.description"));

  return (
    <Section title={t("notFound.title")} subtitle={t("notFound.body")}>
      <div className="btn-row">
        <Link className="btn primary" to="/">
          {t("notFound.cta")}
        </Link>
        <Link className="btn" to="/messenger">
          {t("nav.messenger")}
        </Link>
        <Link className="btn" to="/helix">
          {t("nav.helix")}
        </Link>
      </div>
    </Section>
  );
}
