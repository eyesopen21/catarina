import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode, RefObject } from "react";
import type { AuthPort } from "../auth/AuthPort";
import esCR from "../i18n/es-CR";
import { demoPlan } from "../mocks/demoData";

type PageId = "home" | "plans" | "curriculum";

const navigation: { id: PageId; label: string; glyph: string }[] = [
  { id: "home", label: esCR.navigation.home, glyph: "⌂" },
  { id: "plans", label: esCR.navigation.plans, glyph: "↗" },
  { id: "curriculum", label: esCR.navigation.curriculum, glyph: "§" },
];

function pageFromHash(): PageId {
  const route = window.location.hash.replace(/^#\/?/, "");
  return navigation.some((item) => item.id === route) ? (route as PageId) : "home";
}

export default function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const previousPageRef = useRef(page);

  useEffect(() => {
    const syncRoute = () => setPage(pageFromHash());
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    document.title = page === "home" ? esCR.app.title : `${pageTitle(page)} | ${esCR.app.name}`;
    if (previousPageRef.current !== page) {
      headingRef.current?.focus();
      previousPageRef.current = page;
    }
  }, [page]);

  function focusMain(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    mainRef.current?.focus();
  }

  return (
    <>
      <a className="skip-link" href="#main-content" onClick={focusMain}>{esCR.app.skipToContent}</a>
      <div className="app-frame">
        <aside className="sidebar" aria-label={esCR.app.workspace}>
          <a className="brand" href="#/home" aria-label={`${esCR.app.name} — ${esCR.navigation.home}`}>
            <span className="brand-mark" aria-hidden="true">c</span>
            <span className="brand-name">{esCR.app.name}<small>{esCR.app.workspace}</small></span>
          </a>

          <nav className="primary-nav" aria-label={esCR.navigation.label}>
            <ul>
              {navigation.map((item) => (
                <li key={item.id}>
                  <a className="nav-link" href={`#/${item.id}`} aria-current={page === item.id ? "page" : undefined}>
                    <span className="nav-glyph" aria-hidden="true">{item.glyph}</span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

        </aside>

        <div className="workspace">
          <header className="topbar">
            <div className="topbar-context">
              <span className="topbar-kicker">{esCR.app.workspace}</span>
              <span className="topbar-divider" aria-hidden="true">/</span>
              <span>{navigation.find((item) => item.id === page)?.label}</span>
            </div>
            <InstitutionalSignIn />
          </header>

          <div className="demo-banner" role="note" aria-label={esCR.demo.label}>
            <span className="demo-banner-icon" aria-hidden="true">i</span>
            <div>
              <p className="demo-banner-title">{esCR.demo.label}</p>
              <p>{esCR.demo.description}</p>
            </div>
          </div>

          <main id="main-content" ref={mainRef} className="main-content" tabIndex={-1}>
            {page === "home" && <HomePage headingRef={headingRef} />}
            {page === "plans" && <PlansPage headingRef={headingRef} />}
            {page === "curriculum" && <CurriculumPage headingRef={headingRef} />}
          </main>

          <footer className="workspace-footer"><span>{esCR.app.name}</span><span>{esCR.app.locale}</span></footer>
        </div>
      </div>
    </>
  );
}

function HomePage({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const planTitle = esCR.home.subjectLabels[demoPlan.subject];
  const planDetail = esCR.home.cycleLabels[demoPlan.cycle];
  const planState = esCR.home.stateLabels[demoPlan.state];
  return <>
    <div className="page-heading home-heading">
      <div>
        <p className="eyebrow">{esCR.home.eyebrow}</p>
        <h1 ref={headingRef} tabIndex={-1}>{esCR.home.title}</h1>
        <p className="page-description">{esCR.home.description}</p>
      </div>
      <a className="primary-action" href="#/plans">{esCR.home.action}<span aria-hidden="true">↗</span></a>
    </div>

    <section className="panel activity-panel" aria-labelledby="plan-preview-title">
      <div className="panel-heading">
        <div><p className="eyebrow">{esCR.home.recent}</p><h2 id="plan-preview-title">{planTitle}</h2></div>
        <span className="status-tag status-warm">{planState}</span>
      </div>
      <p className="panel-copy">{planDetail}</p>
      <p className="muted-note">{esCR.home.recentDescription}</p>
      <a className="text-link" href="#/plans">{esCR.home.openPlan}<span aria-hidden="true">→</span></a>
    </section>
  </>;
}

function PlansPage({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const copy = esCR.pages.plans;
  const planTitle = esCR.home.subjectLabels[demoPlan.subject];
  const planDetail = esCR.home.cycleLabels[demoPlan.cycle];
  return <PageShell headingRef={headingRef} eyebrow={copy.eyebrow} title={copy.title} description={copy.description} status={copy.status}>
    <section className="panel curriculum-card" aria-labelledby="plan-title">
      <div className="source-topline"><span className="source-symbol" aria-hidden="true">P</span><span className="status-tag status-neutral">{copy.previewState}</span></div>
      <h2 id="plan-title">{planTitle}</h2>
      <p className="panel-copy">{planDetail}</p>
      <p className="source-section">{copy.emptyDescription}</p>
    </section>
  </PageShell>;
}

function CurriculumPage({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const copy = esCR.pages.curriculum;
  return <PageShell headingRef={headingRef} eyebrow={copy.eyebrow} title={copy.title} description={copy.description} status={copy.status}>
    <section className="panel curriculum-card" aria-labelledby="source-title">
      <div className="source-topline"><span className="source-symbol" aria-hidden="true">§</span><span className="status-tag status-neutral">{copy.ruleStatus}</span></div>
      <h2 id="source-title">{copy.sourceName}</h2>
      <p className="panel-copy">{copy.sourceDetail}</p>
      <p className="source-section">{copy.sourceSection}</p>
      <div className="validation-note" role="status">
        <span className="validation-dot" aria-hidden="true" />
        <div><strong>{copy.validationTitle}</strong><p>{copy.validationDescription}</p></div>
      </div>
    </section>
  </PageShell>;
}

function PageShell({
  headingRef,
  eyebrow,
  title,
  description,
  status,
  children,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  eyebrow: string;
  title: string;
  description: string;
  status?: string;
  children: ReactNode;
}) {
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">{eyebrow}</p><h1 ref={headingRef} tabIndex={-1}>{title}</h1><p className="page-description">{description}</p></div>
      {status && <span className="status-tag status-pending page-status">{status}</span>}
    </div>
    {children}
  </>;
}

function InstitutionalSignIn({ authPort }: { authPort?: AuthPort } = {}) {
  return <div className="auth-entry">
    <button
      className="auth-button"
      type="button"
      disabled={!authPort}
      aria-describedby="auth-status"
      onClick={() => { if (authPort) void authPort.beginSignIn(); }}
    >
      {esCR.auth.title}
    </button>
    <span id="auth-status" className="auth-caption">{esCR.auth.oidc}</span>
  </div>;
}

function pageTitle(page: PageId): string {
  if (page === "home") return esCR.navigation.home;
  return esCR.pages[page].title;
}
