import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import Scramble from "../components/Scramble";
import Icon from "../components/Icon";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

export default function NotFound() {
  const { t, path } = useI18n();
  useSeo(t("meta.notFound.title"), t("meta.notFound.description"));

  return (
    <PageHero label="404" title={<Scramble text={t("notFound.title")} />} lead={t("notFound.body")} compact last>
      <div className="btn-row">
        <Link className="btn primary" to={path("home")}>
          {t("notFound.cta")}
          <Icon name="arrowRight" size={16} />
        </Link>
        <Link className="btn" to={path("messenger")}>
          Silvra Messenger
        </Link>
        <Link className="btn" to={path("helix")}>
          {t("nav.helixFull")}
        </Link>
      </div>
    </PageHero>
  );
}
