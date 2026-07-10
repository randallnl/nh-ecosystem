const page = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NH Solidarity Ecosystem</title>
    <meta
      name="description"
      content="A secure member-only community for New Hampshire organizations sharing legislation, events, projects, and mutual support."
    />
    <style>
      :root {
        color-scheme: light;
        --ink: #10233f;
        --muted: #5b6f88;
        --paper: #f6faff;
        --panel: rgba(255, 255, 255, 0.82);
        --line: rgba(154, 184, 217, 0.42);
        --accent: #1f67b1;
        --accent-2: #63a5df;
        --accent-3: #f2c85f;
        --soft-blue: #e9f4ff;
        --radius-xl: 34px;
        --radius-lg: 26px;
        --radius-md: 18px;
        --radius-pill: 999px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 18% 16%, rgba(99, 165, 223, 0.24), transparent 31%),
          linear-gradient(140deg, #fbfdff 0%, #eef7ff 48%, #f8fbff 100%);
      }

      body::before {
        position: fixed;
        inset: 0;
        pointer-events: none;
        content: "";
        background-image:
          linear-gradient(rgba(31, 103, 177, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(31, 103, 177, 0.05) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: linear-gradient(to bottom, black, transparent 76%);
      }

      main {
        position: relative;
        width: min(1180px, calc(100% - 32px));
        min-height: 100vh;
        margin: 0 auto;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 34px;
        padding: 28px 0 38px;
      }

      .nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 12px 14px 12px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: rgba(255, 255, 255, 0.72);
        box-shadow: 0 18px 60px rgba(31, 82, 135, 0.08);
        backdrop-filter: blur(18px);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        font-weight: 850;
      }

      .brand-mark {
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border-radius: var(--radius-pill);
        color: #ffffff;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        box-shadow: 0 10px 24px rgba(31, 103, 177, 0.25);
      }

      .nav-links {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .nav-links span,
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 8px 14px;
        border-radius: var(--radius-pill);
        font-size: 0.92rem;
        font-weight: 750;
      }

      .nav-links span {
        color: var(--muted);
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
        gap: 42px;
        align-items: center;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 34px;
        margin: 0 0 18px;
        padding: 7px 13px;
        border: 1px solid rgba(31, 103, 177, 0.16);
        border-radius: var(--radius-pill);
        color: var(--accent);
        background: rgba(255, 255, 255, 0.76);
        font-size: 0.82rem;
        font-weight: 850;
      }

      h1 {
        margin: 0;
        max-width: 780px;
        font-size: clamp(3.3rem, 8.4vw, 7.35rem);
        line-height: 0.88;
        letter-spacing: 0;
      }

      .lede {
        max-width: 690px;
        margin: 28px 0 0;
        color: var(--muted);
        font-size: clamp(1.08rem, 2vw, 1.34rem);
        line-height: 1.58;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 32px;
      }

      .button {
        border: 1px solid transparent;
        text-decoration: none;
      }

      .button.primary {
        color: #ffffff;
        background: var(--accent);
        box-shadow: 0 16px 34px rgba(31, 103, 177, 0.25);
      }

      .button.secondary {
        color: var(--accent);
        border-color: rgba(31, 103, 177, 0.18);
        background: rgba(255, 255, 255, 0.7);
      }

      .status {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 24px;
      }

      .status span {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 7px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius-pill);
        background: rgba(255, 255, 255, 0.68);
        color: #27425f;
        font-size: 0.88rem;
        font-weight: 750;
      }

      .panel {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius-xl);
        background: var(--panel);
        box-shadow: 0 28px 90px rgba(31, 82, 135, 0.14);
        padding: 22px;
        backdrop-filter: blur(22px);
      }

      .panel::before {
        position: absolute;
        inset: 0 0 auto;
        height: 6px;
        content: "";
        background: linear-gradient(90deg, var(--accent), var(--accent-2), var(--accent-3));
      }

      .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      .panel h2 {
        margin: 0;
        font-size: 1.08rem;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 6px 10px;
        border-radius: var(--radius-pill);
        color: var(--accent);
        background: var(--soft-blue);
        font-size: 0.78rem;
        font-weight: 850;
      }

      .list {
        display: grid;
        gap: 12px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .list li {
        display: grid;
        grid-template-columns: 34px 1fr;
        gap: 12px;
        align-items: start;
        padding: 12px;
        border: 1px solid rgba(216, 228, 242, 0.68);
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.64);
        color: var(--muted);
        line-height: 1.45;
      }

      .mark {
        display: grid;
        width: 34px;
        height: 34px;
        place-items: center;
        border-radius: var(--radius-pill);
        color: #ffffff;
        background: var(--accent);
        font-size: 0.86rem;
        font-weight: 850;
      }

      .bar {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .bar div {
        min-height: 138px;
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: rgba(255, 255, 255, 0.72);
        box-shadow: 0 18px 52px rgba(31, 82, 135, 0.08);
      }

      .bar strong {
        display: block;
        margin-bottom: 10px;
        font-size: 1rem;
      }

      .bar span {
        color: var(--muted);
        font-size: 0.94rem;
        line-height: 1.44;
      }

      @media (max-width: 900px) {
        main {
          grid-template-rows: auto auto auto;
          padding-top: 18px;
        }

        .nav {
          align-items: flex-start;
          border-radius: var(--radius-lg);
        }

        .nav-links {
          display: none;
        }

        .hero {
          grid-template-columns: 1fr;
          gap: 28px;
        }

        .bar {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 620px) {
        h1 {
          font-size: clamp(3rem, 18vw, 4.6rem);
        }

        .panel {
          padding: 16px;
        }

        .bar {
          grid-template-columns: 1fr;
        }

        .bar div {
          min-height: auto;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <nav class="nav" aria-label="Site">
        <div class="brand">
          <span class="brand-mark">NH</span>
          <span>Solidarity Ecosystem</span>
        </div>
        <div class="nav-links" aria-label="Planned sections">
          <span>Legislation</span>
          <span>Events</span>
          <span>Projects</span>
          <span>Organizations</span>
        </div>
      </nav>

      <section class="hero" aria-label="NH Solidarity Ecosystem">
        <div>
          <p class="eyebrow">Member-only community in development</p>
          <h1>NH Solidarity Ecosystem</h1>
          <p class="lede">
            A secure coordination space for New Hampshire organizations working
            across legislation, events, shared projects, and long-term mutual support.
          </p>
          <div class="actions" aria-label="Project status actions">
            <a class="button primary" href="https://github.com/randallnl/nh-ecosystem">View project</a>
            <span class="button secondary">Cloudflare Worker preview</span>
          </div>
          <div class="status" aria-label="Planned platform components">
            <span>Invite-only access</span>
            <span>Organization profiles</span>
            <span>Posts and comments</span>
            <span>Private file sharing</span>
          </div>
        </div>

        <aside class="panel" aria-label="Build roadmap">
          <div class="panel-head">
            <h2>First build priorities</h2>
            <span class="badge">Roadmap</span>
          </div>
          <ul class="list">
            <li><span class="mark">1</span><span>Member accounts, invitations, and organization roles.</span></li>
            <li><span class="mark">2</span><span>Legislation notes, events, projects, updates, and comments.</span></li>
            <li><span class="mark">3</span><span>Private uploads backed by Cloudflare R2 and structured data in D1.</span></li>
            <li><span class="mark">4</span><span>Admin tools for approvals, moderation, and community stewardship.</span></li>
          </ul>
        </aside>
      </section>

      <section class="bar" aria-label="Community sections">
        <div><strong>Legislation</strong><span>Track bills, hearings, testimony, and organizational positions.</span></div>
        <div><strong>Events</strong><span>Share meetings, actions, trainings, and coalition gatherings.</span></div>
        <div><strong>Projects</strong><span>Coordinate shared work across member organizations.</span></div>
        <div><strong>Organizations</strong><span>Maintain profiles, contacts, issue areas, and member roles.</span></div>
      </section>
    </main>
  </body>
</html>`;

export default {
  async fetch() {
    return new Response(page, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
      },
    });
  },
} satisfies ExportedHandler;
