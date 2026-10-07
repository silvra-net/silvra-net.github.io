import { useI18n } from "../i18n";
import { useNodeStatus } from "../lib/node";
import CountUp from "./CountUp";
import Icon from "./Icon";
import { EXPLORER } from "../lib/links";

/**
 * The live state of the public node, as a panel. Every number is fetched from node.silvra.net;
 * nothing here is cached or invented on our side, and an unreachable node says so.
 */
export default function Testnet({ explorer = true }: { explorer?: boolean }) {
  const { t, lang } = useI18n();
  const { status, failed } = useNodeStatus();
  const locale = lang === "de" ? "de-DE" : "en-GB";

  return (
    <div className="testnet">
      <div className="testnet-head">
        <span className={status && !failed ? "dot ok pulse" : "dot off"} />
        <span className="testnet-title">{t("home.testnet.title")}</span>
        <span className="testnet-source mono">{failed ? t("home.testnet.offline") : t("home.testnet.live")}</span>
      </div>
      <div className="testnet-height">
        <span className="testnet-label">{t("home.testnet.stats.height")}</span>
        <span className="testnet-big mono">{status ? <CountUp value={status.height} locale={locale} /> : failed ? "—" : "…"}</span>
      </div>
      <dl className="testnet-stats">
        <div>
          <dt>{t("home.testnet.stats.peers")}</dt>
          <dd className="mono">{status ? status.peer_count : "—"}</dd>
        </div>
        <div>
          <dt>{t("home.testnet.stats.mempool")}</dt>
          <dd className="mono">{status ? status.mempool_size : "—"}</dd>
        </div>
        <div>
          <dt>{t("home.testnet.stats.status")}</dt>
          <dd className="mono">
            {status ? (status.is_syncing ? t("home.testnet.stats.statusSync") : t("home.testnet.stats.statusLive")) : "—"}
          </dd>
        </div>
        <div>
          <dt>{t("home.testnet.stats.version")}</dt>
          <dd className="mono">{status ? `v${status.version}` : "—"}</dd>
        </div>
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
