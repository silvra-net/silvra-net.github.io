import { phrase, useI18n } from "../i18n";
import type { Lang } from "../i18n";

/**
 * Said, not shown: the last words of a link that opens in a new tab, so a screen reader announces
 * that behaviour on every such link, not only in the footer. In the language on screen, or in
 * `lang` where a link belongs to one language of a page that shows both.
 */
export default function NewTab({ lang }: { lang?: Lang }) {
  const { t } = useI18n();
  return <span className="sr-only">{lang ? phrase(lang, "footer.newTab") : t("footer.newTab")}</span>;
}
