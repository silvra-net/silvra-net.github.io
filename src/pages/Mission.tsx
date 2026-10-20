import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import Photo from "../components/Photo";
import Reveal from "../components/Reveal";
import SectionLabel from "../components/SectionLabel";
import ScrollWords from "../components/ScrollWords";
import Icon from "../components/Icon";
import { useI18n } from "../i18n";
import { useSeo } from "../lib/seo";

interface Item {
  title: string;
  body: string;
}
interface Group {
  heading: string;
  items: Item[];
}

export default function Mission() {
  const { t, list, raw, path } = useI18n();
  useSeo(t("meta.mission.title"), t("meta.mission.description"));
  const expect = raw("mission.principles.expect") as Group;
  const noPromise = raw("mission.principles.noPromise") as Group;

  return (
    <>
      <PageHero
        label={t("mission.eyebrow")}
        title={t("mission.title")}
        lead={t("mission.subtitle")}
        media={<Photo slot="mission" priority />}
      />

      <section className="section">
        <div className="container">
          <SectionLabel index="01" text={t("mission.approach.eyebrow")} />
          <ScrollWords className="statement" text={t("mission.approach.statement")} />
          <div className="prose-grid">
            {list<string>("mission.approach.paragraphs").map((p, i) => (
              <Reveal key={p.slice(0, 40)} delay={i * 80}>
                {/* Letters, not numbers: the section itself already carries the index 01. */}
                <span className="prose-num mono">{["A", "B", "C"][i]}</span>
                <p className="muted">{p}</p>
              </Reveal>
            ))}
          </div>
          <div className="badge-row">
            {list<string>("mission.approach.badges").map((b) => (
              <span className="badge" key={b}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionLabel index="02" text={t("mission.principles.eyebrow")} />
          <div className="section-head">
            <h2>{t("mission.principles.title")}</h2>
          </div>
          {/* The two lists face each other across the blade: what we hold to, what we refuse to claim. */}
          <div className="versus">
            {[
              { g: expect, kind: "yes", icon: "check" },
              { g: noPromise, kind: "no", icon: "close" },
            ].map(({ g, kind, icon }) => (
              <Reveal key={kind} className={`versus-col versus-${kind}`}>
                <h3>{g.heading}</h3>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.title}>
                      <Icon name={icon} size={18} />
                      <div>
                        <strong>{it.title}</strong>
                        <p className="muted">{it.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
            <span className="versus-blade" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="section join">
        <div className="container">
          <SectionLabel index="03" text={t("home.join.label")} />
          <h2 className="join-title">{t("home.join.title")}</h2>
          <div className="join-grid">
            <p className="lead">{t("home.join.body")}</p>
            <div className="btn-row">
              <a className="btn primary" href={`mailto:${t("home.join.email")}`}>
                <Icon name="mail" size={16} />
                {t("home.join.email")}
              </a>
              <Link className="btn" to={path("contact")}>
                {t("nav.contact")}
                <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
