import styles from "./LegalDocPage.module.css";

export type LegalDocSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDoc = {
  title: string;
  effective_date?: string;
  intro?: string[];
  sections: LegalDocSection[];
  footer?: string;
};

export function LegalDocPage(props: { doc: LegalDoc }) {
  const { doc } = props;

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>{doc.title}</h1>
        {doc.effective_date && <div className={styles.meta}>Effective date: {doc.effective_date}</div>}
      </header>

      {doc.intro?.length ? (
        <section className={styles.card}>
          {doc.intro.map((p, idx) => (
            <p key={idx} className={styles.p}>
              {p}
            </p>
          ))}
        </section>
      ) : null}

      {doc.sections.map((s, i) => (
        <section key={i} className={styles.card}>
          <h2 className={styles.h2}>{s.heading}</h2>

          {s.paragraphs?.map((p, idx) => (
            <p key={idx} className={styles.p}>
              {p}
            </p>
          ))}

          {s.bullets?.length ? (
            <ul className={styles.ul}>
              {s.bullets.map((b, idx) => (
                <li key={idx} className={styles.li}>
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {doc.footer ? <footer className={styles.footer}>{doc.footer}</footer> : null}
    </main>
  );
}
