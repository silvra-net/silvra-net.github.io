import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import CountUp from "./CountUp";

/** The public node's status endpoint. Same origin the explorer reads, and the only place these
 *  numbers come from — nothing here is cached or precomputed on our side. */
const NODE = "https://node.silvra.net";

interface Status {
  version: string;
  height: number;
  peer_count: number;
  mempool_size: number;
  is_syncing: boolean;
}

export default function Testnet() {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${NODE}/status`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Status;
        if (alive) {
          setStatus(data);
          setFailed(false);
        }
      } catch {
        // A node that cannot be reached is reported as such rather than as a frozen number:
        // a stale height that looks live is worse than an honest gap.
        if (alive) setFailed(true);
      }
    };
    void load();
    const timer = setInterval(load, 10_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const metrics = status
    ? [
        { label: t("home.testnet.stats.height"), node: <CountUp value={status.height} /> },
        { label: "Peers", node: <>{status.peer_count}</> },
        { label: "Mempool", node: <>{status.mempool_size}</> },
        { label: t("home.testnet.stats.status"), node: <>{status.is_syncing ? "Sync" : t("home.testnet.stats.statusLive")}</> },
      ]
    : [];

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <span className={status && !failed ? "dot ok" : "dot off"} />
        <strong>{t("home.testnet.title")}</strong>
        <span className="small muted mono" style={{ marginLeft: "auto" }}>
          {failed ? t("home.testnet.offline") : t("home.testnet.live")}
        </span>
      </div>

      {metrics.length > 0 ? (
        <div className="metrics">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">{m.node}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted small" style={{ margin: 0 }}>
          {failed ? t("home.testnet.offline") : "…"}
        </p>
      )}

      {status && (
        <p className="small muted mono" style={{ margin: "20px 0 0" }}>
          {t("home.testnet.public")} · v{status.version}
        </p>
      )}
    </div>
  );
}
