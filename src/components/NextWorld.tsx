import { Link } from "react-router-dom";
import CipherCanvas from "./CipherCanvas";
import HelixCanvas from "./HelixCanvas";
import Icon from "./Icon";
import { useI18n } from "../i18n";

/**
 * The end of one product page is the door to the other: a diagonal band in the other world's
 * colour, the same blade as the home page, so the two pages read as two halves of one place.
 */
export default function NextWorld({ to }: { to: "messenger" | "helix" }) {
  const { t, list } = useI18n();
  return (
    <Link to={`/${to}`} className={`next-world next-${to} dark-zone`}>
      <div className="next-world-bg" aria-hidden="true">
        {to === "helix" ? (
          <HelixCanvas cx={0.72} cy={0.5} tilt={1.2} radius={90} length={1.4} />
        ) : (
          <CipherCanvas phrases={list<string>("home.gate.messenger.phrases")} cell={22} />
        )}
      </div>
      <div className="container next-world-body">
        <p className="label">{t("next.label")}</p>
        <p className="next-world-title" id={`next-${to}-title`}>
          {to === "helix" ? "Helix Blockchain" : "Silvra Messenger"}
        </p>
        <p className="next-world-text">{t(`next.${to}`)}</p>
        <span className="next-world-cta">
          {t("next.cta")}
          <Icon name="arrowRight" size={20} />
        </span>
      </div>
    </Link>
  );
}
