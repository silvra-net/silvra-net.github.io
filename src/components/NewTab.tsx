import { useI18n } from "../i18n";

/**
 * Said, not shown: the last words of a link that opens in a new tab, so a screen reader announces
 * that behaviour on every such link, not only in the footer.
 */
export default function NewTab() {
  const { t } = useI18n();
  return <span className="sr-only">{t("footer.newTab")}</span>;
}
