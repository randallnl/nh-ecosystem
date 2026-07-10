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
        --ink: #18201c;
        --muted: #53645c;
        --paper: #faf8f1;
        --panel: #ffffff;
        --line: #d9ded4;
        --accent: #146c5f;
        --accent-2: #b7422d;
        --accent-3: #e3b23c;
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
          linear-gradient(135deg, rgba(20, 108, 95, 0.12), transparent 34%),
          linear-gradient(315deg, rgba(183, 66, 45, 0.13), transparent 40%),
          var(--paper);
      }

      main {
        width: min(1120px, calc(100% - 32px));
        min-height: 100vh;
        margin: 0 auto;
        display: grid;
        align-items: center;
        gap: 32px;
        padding: 44px 0;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
        gap: 48px;
        align-items: center;
      }

      .eyebrow {
        margin: 0 0 16px;
        color: var(--accent);
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        max-width: 760px;
        font-size: clamp(3rem, 8vw, 6.8rem);
        line-height: 0.9;
        letter-spacing: 0;
      }

      .lede {
        max-width: 680px;
        margin: 28px 0 0;
        color: var(--muted);
        font-size: clamp(1.05rem, 2vw, 1.32rem);
        line-height: 1.58;
      }

      .status {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 30px;
      }

      .status span {
        display: inline-flex;
        align-items: center;
        min-height: 36px;
        padding: 8px 12px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.62);
        font-size: 0.9rem;
        font-weight: 700;
      }

      .panel {
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.82);
        box-shadow: 0 24px 70px rgba(37, 45, 40, 0.11);
        padding: 24px;
      }

      .panel h2 {
        margin: 0 0 18px;
        font-size: 1.1rem;
      }

      .list {
        display: grid;
        gap: 14px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .list li {
        display: grid;
        grid-template-columns: 12px 1fr;
        gap: 12px;
        align-items: start;
        color: var(--muted);
        line-height: 1.45;
      }

      .mark {
        width: 12px;
        height: 12px;
        margin-top: 5px;
        background: var(--accent-3);
        border: 2px solid var(--ink);
      }

      .bar {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.76);
      }

      .bar div {
        min-height: 96px;
        padding: 16px;
        border-right: 1px solid var(--line);
      }

      .bar div:last-child {
        border-right: 0;
      }

      .bar strong {
        display: block;
        margin-bottom: 8px;
      }

      .bar span {
        color: var(--muted);
        font-size: 0.92rem;
        line-height: 1.4;
      }

      @media (max-width: 820px) {
        main {
          align-items: start;
        }

        .hero {
          grid-template-columns: 1fr;
          gap: 28px;
        }

        .bar {
          grid-template-columns: 1fr;
        }

        .bar div {
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .bar div:last-child {
          border-bottom: 0;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero" aria-label="NH Solidarity Ecosystem">
        <div>
          <p class="eyebrow">Member-only community in development</p>
          <h1>NH Solidarity Ecosystem</h1>
          <p class="lede">
            A secure space for New Hampshire organizations to coordinate around
            legislation, events, shared projects, and the slow practical work of
            staying connected.
          </p>
          <div class="status" aria-label="Planned platform components">
            <span>Invite-only access</span>
            <span>Organization profiles</span>
            <span>Posts and comments</span>
            <span>Private file sharing</span>
          </div>
        </div>

        <aside class="panel" aria-label="Build roadmap">
          <h2>First build priorities</h2>
          <ul class="list">
            <li><span class="mark"></span><span>Member accounts, invitations, and organization roles.</span></li>
            <li><span class="mark"></span><span>Legislation notes, events, projects, updates, and comments.</span></li>
            <li><span class="mark"></span><span>Private uploads backed by Cloudflare R2 and structured data in D1.</span></li>
            <li><span class="mark"></span><span>Admin tools for approvals, moderation, and community stewardship.</span></li>
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
