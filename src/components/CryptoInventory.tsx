import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import Icon from "./Icon";
import { HELIX_DOCS } from "../lib/links";

type Status = "pq" | "sym" | "classic" | "none";

interface Row {
  part: string;
  method: string;
  standard: string;
  status: Status;
  note: string;
}
interface Group {
  name: string;
  rows: Row[];
}

const ORDER: Status[] = ["pq", "sym", "classic", "none"];
const ICON: Record<Status, string> = { pq: "shield", sym: "lock", classic: "alert", none: "unlock" };

/**
 * Every cryptographic building block in both products, with its standard and an honest status —
 * including the parts that are still classical. A research group publishes what it uses and
 * where it falls short; this is that table, with its sources underneath.
 *
 * The bar on top is a count, not a score: how many of the building blocks fall in each status.
 * Status always comes as icon plus word, never as colour alone.
 */
export default function CryptoInventory() {
  const { t, list } = useI18n();
  const groups = list<Group>("home.inventory.groups");
  const rows = groups.flatMap((g) => g.rows);
  const count = (s: Status) => rows.filter((r) => r.status === s).length;

  return (
    <div className="inventory">
      <div className="inventory-summary">
        <div className="inventory-bar" aria-hidden="true">
          {ORDER.map((s) =>
            count(s) ? <span key={s} className={`seg st-${s}`} style={{ flexGrow: count(s) }} /> : null,
          )}
        </div>
        <ul className="inventory-legend">
          {ORDER.map((s) => (
            <li key={s} className={`st-${s}`}>
              <Icon name={ICON[s]} size={14} />
              <strong>{count(s)}</strong> {t(`home.inventory.status.${s}`)}
            </li>
          ))}
        </ul>
      </div>

      <table className="inventory-table">
        <caption className="sr-only">{t("home.inventory.caption")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("home.inventory.cols.part")}</th>
            <th scope="col">{t("home.inventory.cols.method")}</th>
            <th scope="col">{t("home.inventory.cols.standard")}</th>
            <th scope="col">{t("home.inventory.cols.status")}</th>
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.name}>
            <tr className="inventory-group">
              <th scope="rowgroup" colSpan={4}>
                {g.name}
              </th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.part}>
                <th scope="row">
                  {r.part}
                  <span className="inventory-note">{r.note}</span>
                </th>
                <td className="mono" data-label={t("home.inventory.cols.method")}>
                  {r.method}
                </td>
                <td className="mono" data-label={t("home.inventory.cols.standard")}>
                  {r.standard}
                </td>
                <td data-label={t("home.inventory.cols.status")}>
                  <span className={`inventory-status st-${r.status}`}>
                    <Icon name={ICON[r.status]} size={14} />
                    {t(`home.inventory.status.${r.status}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>

      <p className="inventory-sources">
        <span className="mono">{t("home.inventory.sourcesLabel")}</span>
        <a href={`${HELIX_DOCS}/internals.md#cryptography--determinism`} rel="noreferrer noopener" target="_blank">
          {t("home.inventory.sourceHelix")}
        </a>
        <span aria-hidden="true">·</span>
        <Link to="/messenger#transparenz">{t("home.inventory.sourceMessenger")}</Link>
      </p>
    </div>
  );
}
