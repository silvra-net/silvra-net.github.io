import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import Scramble from "../components/Scramble";
import Icon from "../components/Icon";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

export default function NotFound() {
  const { t } = useI18n();
  useSeo(t("meta.notFound.title"), t("meta.notFound.description"));

  return (
    <PageHero label="404" title={<Scramble text={t("notFound.title")} />} lead={t("notFound.body")}>
      <div className="btn-row">
        <Link className="btn primary" to="/">
          {t("notFound.cta")}
          <Icon name="arrowRight" size={16} />
        </Link>
        <Link className="btn" to="/messenger">
          Silvra Messenger
        </Link>
        <Link className="btn" to="/helix">
          Helix Blockchain
        </Link>
      </div>
    </PageHero>
  );
}
