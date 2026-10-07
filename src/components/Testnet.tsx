import { useI18n } from "../i18n";
import { useNodeStatus } from "../lib/node";
import CountUp from "./CountUp";
import Icon from "./Icon";
import { EXPLORER } from "../lib/links";

/**
 * The live state of the network, as a panel. Every number is fetched from node.silvra.net;
 * nothing here is cached or invented on our side, and an unreachable node says so.
 */
export default function Testnet({ explorer = true }: { explorer?: boolean }) {
  const { t, lang } = useI18n();
  const { status, failed, validators } = useNodeStatus();
  const locale = lang === "de" ? "de-DE" : "en-GB";
  const hlx = (v?: number, digits = 0) =>
    v === undefined ? "—" : `${v.toLocaleString(locale, { maximumFractionDigits: digits })}`;

  const stats: { label: string; value: string }[] = [
    { label: t("home.testnet.stats.validators"), value: validators === null ? "—" : String(validators) },
    { label: t("home.testnet.stats.accounts"), value: status?.total_accounts === undefined ? "—" : hlx(status.total_accounts) },
    { label: t("home.testnet.stats.supply"), value: status ? `${hlx(status.circulating_supply_hlx)} HLX` : "—" },
    { label: t("home.testnet.stats.burned"), value: status ? `${hlx(status.total_burned_hlx, 4)} HLX` : "—" },
    { label: t("home.testnet.stats.peers"), value: status ? String(status.peer_count) : "—" },
    { label: t("home.testnet.stats.version"), value: status ? `v${status.version}` : "—" },
  ];

  return (
    <div className="testnet">
      <div className="testnet-head">
        <span className={status && !failed ? "dot ok pulse" : "dot off"} />
        <span className="testnet-title">{t("home.testnet.title")}</span>
        <span className="testnet-source mono">{failed ? t("home.testnet.offline") : t("home.testnet.live")}</span>
      </div>
      <div className="testnet-height">
        <span className="testnet-label">{t("home.testnet.stats.height")}</span>
        <span className="testnet-big mono">
          {status ? <CountUp value={status.height} locale={locale} /> : failed ? "—" : "…"}
        </span>
      </div>
      <dl className="testnet-stats">
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd className="mono">{s.value}</dd>
          </div>
        ))}
      </dl>
      {explorer && (
        <a className="testnet-link" href={EXPLORER}>
          {t("home.testnet.explorer")}
          <Icon name="arrowUpRight" size={16} />
        </a>
      )}
    </div>
  );
}
