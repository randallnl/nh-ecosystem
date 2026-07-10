interface Env {
  DB: D1Database;
  EMAIL: {
    send(message: {
      to: string;
      from: { email: string; name: string };
      replyTo?: string;
      subject: string;
      html: string;
      text: string;
    }): Promise<unknown>;
  };
}

type User = {
  id: string;
  email: string;
  name: string | null;
  site_role: "member" | "site_admin";
  status: "invited" | "active" | "suspended";
};

type SessionContext = {
  user: User | null;
  sessionId: string | null;
};

const SESSION_COOKIE = "nhse_session";
const SESSION_DAYS = 30;
const TOKEN_MINUTES = 20;
const FROM_EMAIL = "no-reply@nhsolidarityecosystem.com";
const FROM_NAME = "NH Solidarity Ecosystem";

const baseStyles = String.raw`
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
    --danger: #b33b4a;
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
    color: var(--ink);
    font-weight: 850;
    text-decoration: none;
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

  .nav-links,
  .actions,
  .status {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .nav-links {
    justify-content: flex-end;
  }

  .nav-links a,
  .nav-links span,
  .button,
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    padding: 8px 14px;
    border-radius: var(--radius-pill);
    font: inherit;
    font-size: 0.92rem;
    font-weight: 750;
    text-decoration: none;
  }

  .nav-links a,
  .nav-links span {
    color: var(--muted);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
    gap: 42px;
    align-items: center;
  }

  .eyebrow,
  .badge {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    border-radius: var(--radius-pill);
    font-weight: 850;
  }

  .eyebrow {
    gap: 8px;
    margin: 0 0 18px;
    padding: 7px 13px;
    border: 1px solid rgba(31, 103, 177, 0.16);
    color: var(--accent);
    background: rgba(255, 255, 255, 0.76);
    font-size: 0.82rem;
  }

  h1 {
    margin: 0;
    max-width: 780px;
    font-size: clamp(3.3rem, 8.4vw, 7.35rem);
    line-height: 0.88;
    letter-spacing: 0;
  }

  h2,
  h3,
  p {
    margin-top: 0;
  }

  .lede {
    max-width: 690px;
    margin: 28px 0 0;
    color: var(--muted);
    font-size: clamp(1.08rem, 2vw, 1.34rem);
    line-height: 1.58;
  }

  .actions {
    margin-top: 32px;
  }

  .button,
  button {
    border: 1px solid transparent;
    cursor: pointer;
  }

  .button.primary,
  button.primary {
    color: #ffffff;
    background: var(--accent);
    box-shadow: 0 16px 34px rgba(31, 103, 177, 0.25);
  }

  .button.secondary,
  button.secondary {
    color: var(--accent);
    border-color: rgba(31, 103, 177, 0.18);
    background: rgba(255, 255, 255, 0.7);
  }

  .button.danger,
  button.danger {
    color: var(--danger);
    border-color: rgba(179, 59, 74, 0.2);
    background: rgba(255, 255, 255, 0.7);
  }

  .status {
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

  .panel,
  .auth-card,
  .tile {
    border: 1px solid var(--line);
    background: var(--panel);
    box-shadow: 0 28px 90px rgba(31, 82, 135, 0.14);
    backdrop-filter: blur(22px);
  }

  .panel {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-xl);
    padding: 22px;
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
    padding: 6px 10px;
    color: var(--accent);
    background: var(--soft-blue);
    font-size: 0.78rem;
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

  .bar,
  .dashboard-grid {
    display: grid;
    gap: 12px;
  }

  .bar {
    grid-template-columns: repeat(4, 1fr);
  }

  .bar div,
  .tile {
    min-height: 138px;
    padding: 18px;
    border-radius: var(--radius-lg);
  }

  .bar div {
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 18px 52px rgba(31, 82, 135, 0.08);
  }

  .bar strong,
  .tile strong {
    display: block;
    margin-bottom: 10px;
    font-size: 1rem;
  }

  .bar span,
  .tile span,
  .muted {
    color: var(--muted);
    font-size: 0.94rem;
    line-height: 1.44;
  }

  .auth-shell {
    display: grid;
    place-items: center;
    min-height: calc(100vh - 150px);
  }

  .auth-card {
    width: min(520px, 100%);
    padding: 24px;
    border-radius: var(--radius-xl);
  }

  .auth-card h1 {
    font-size: clamp(2.4rem, 10vw, 4.2rem);
  }

  form {
    display: grid;
    gap: 14px;
    margin-top: 22px;
  }

  label {
    display: grid;
    gap: 7px;
    color: var(--muted);
    font-size: 0.92rem;
    font-weight: 750;
  }

  input,
  textarea,
  select {
    width: 100%;
    min-height: 48px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: 11px 13px;
    color: var(--ink);
    background: rgba(255, 255, 255, 0.76);
    font: inherit;
  }

  textarea {
    min-height: 108px;
    resize: vertical;
  }

  select {
    appearance: none;
  }

  .notice {
    margin-top: 18px;
    padding: 14px;
    border: 1px solid rgba(31, 103, 177, 0.16);
    border-radius: var(--radius-md);
    color: var(--muted);
    background: rgba(233, 244, 255, 0.74);
    line-height: 1.45;
  }

  .notice a {
    color: var(--accent);
    font-weight: 800;
  }

  .dashboard {
    display: grid;
    align-content: start;
    gap: 22px;
  }

  .dashboard-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    padding: 26px;
    border-radius: var(--radius-xl);
  }

  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .stack {
    display: grid;
    gap: 12px;
  }

  .admin-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 18px;
  }

  .compact-list {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .compact-list li {
    padding: 12px;
    border: 1px solid rgba(216, 228, 242, 0.68);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.64);
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

    .bar,
    .dashboard-grid {
      grid-template-columns: 1fr 1fr;
    }

    .dashboard-hero {
      display: grid;
    }

    .admin-columns {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    h1 {
      font-size: clamp(3rem, 18vw, 4.6rem);
    }

    .panel {
      padding: 16px;
    }

    .bar,
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .bar div,
    .tile {
      min-height: auto;
    }
  }
`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const session = await getSession(request, env);

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, authenticated: Boolean(session.user) });
      }

      if (request.method === "GET" && url.pathname === "/") {
        return html(renderLanding(session.user));
      }

      if (request.method === "GET" && url.pathname === "/setup") {
        return handleSetupPage(env, session.user);
      }

      if (request.method === "POST" && url.pathname === "/setup") {
        assertSameOrigin(request);
        return handleSetup(request, env);
      }

      if (request.method === "GET" && url.pathname === "/login") {
        return html(renderLogin());
      }

      if (request.method === "POST" && url.pathname === "/login") {
        assertSameOrigin(request);
        return handleLogin(request, env);
      }

      if (request.method === "GET" && url.pathname === "/auth/verify") {
        return handleVerify(url, env);
      }

      if (request.method === "GET" && url.pathname === "/request-invite") {
        return html(renderInviteRequest());
      }

      if (request.method === "POST" && url.pathname === "/request-invite") {
        assertSameOrigin(request);
        return handleInviteRequest(request, env);
      }

      if (request.method === "POST" && url.pathname === "/logout") {
        assertSameOrigin(request);
        return handleLogout(session, env);
      }

      if (request.method === "POST" && url.pathname === "/admin/organizations") {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        requireSiteAdmin(user);
        return handleCreateOrganization(request, env, user);
      }

      if (request.method === "POST" && url.pathname === "/admin/invitations") {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        requireSiteAdmin(user);
        return handleAdminInvite(request, env, user);
      }

      if (url.pathname === "/app") {
        const user = requireUser(session.user);
        return html(await renderApp(env, user));
      }

      if (url.pathname === "/admin") {
        const user = requireUser(session.user);
        requireSiteAdmin(user);
        return html(await renderAdmin(env, user));
      }

      return notFound();
    } catch (error) {
      if (error instanceof RedirectError) {
        return redirect(error.location);
      }

      if (error instanceof HttpError) {
        return html(renderError(error.title, error.message), error.status);
      }

      console.error(error);
      return html(renderError("Something went sideways", "The request could not be completed."), 500);
    }
  },
} satisfies ExportedHandler<Env>;

function renderLanding(user: User | null) {
  const primaryAction = user
    ? `<a class="button primary" href="/app">Open member dashboard</a>`
    : `<a class="button primary" href="/login">Member sign in</a>`;

  const secondaryAction = user
    ? `<form method="post" action="/logout"><button class="secondary" type="submit">Sign out</button></form>`
    : `<a class="button secondary" href="/request-invite">Request an invite</a>`;

  return layout("NH Solidarity Ecosystem", String.raw`
    <section class="hero" aria-label="NH Solidarity Ecosystem">
      <div>
        <p class="eyebrow">Member-only community in development</p>
        <h1>NH Solidarity Ecosystem</h1>
        <p class="lede">
          A secure coordination space for New Hampshire organizations working
          across legislation, events, shared projects, and long-term mutual support.
        </p>
        <div class="actions" aria-label="Project status actions">
          ${primaryAction}
          ${secondaryAction}
        </div>
        <div class="status" aria-label="Platform components">
          <span>Invite-only access</span>
          <span>D1-backed sessions</span>
          <span>Protected member area</span>
          <span>Role-aware admin</span>
        </div>
      </div>

      <aside class="panel" aria-label="Authorization roadmap">
        <div class="panel-head">
          <h2>Authorization now in place</h2>
          <span class="badge">MVP</span>
        </div>
        <ul class="list">
          <li><span class="mark">1</span><span>First-admin setup is only available before any users exist.</span></li>
          <li><span class="mark">2</span><span>Login tokens are hashed in D1 and expire after ${TOKEN_MINUTES} minutes.</span></li>
          <li><span class="mark">3</span><span>Sessions use HTTP-only, secure cookies and server-side revocation.</span></li>
          <li><span class="mark">4</span><span>Member and admin routes check the current session before rendering.</span></li>
        </ul>
      </aside>
    </section>

    <section class="bar" aria-label="Community sections">
      <div><strong>Legislation</strong><span>Track bills, hearings, testimony, and organizational positions.</span></div>
      <div><strong>Events</strong><span>Share meetings, actions, trainings, and coalition gatherings.</span></div>
      <div><strong>Projects</strong><span>Coordinate shared work across member organizations.</span></div>
      <div><strong>Organizations</strong><span>Maintain profiles, contacts, issue areas, and member roles.</span></div>
    </section>
  `, user);
}

function renderLogin(message = "") {
  return layout("Member sign in", String.raw`
    <section class="auth-shell">
      <div class="auth-card">
        <p class="eyebrow">Invite-only access</p>
        <h1>Member sign in</h1>
        <p class="lede">Enter the email connected to your approved member account. The current MVP generates a short-lived magic link on the next screen until email delivery is wired in.</p>
        <form method="post" action="/login">
          <label>
            Email
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <button class="primary" type="submit">Send sign-in link</button>
        </form>
        ${message ? `<div class="notice">${escapeHtml(message)}</div>` : ""}
      </div>
    </section>
  `, null);
}

function renderInviteRequest() {
  return layout("Request an invite", String.raw`
    <section class="auth-shell">
      <div class="auth-card">
        <p class="eyebrow">Community access</p>
        <h1>Request an invite</h1>
        <p class="lede">Share the organization email you would like reviewed for membership.</p>
        <form method="post" action="/request-invite">
          <label>
            Email
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <label>
            Organization name
            <input name="organization" type="text" autocomplete="organization" />
          </label>
          <label>
            Note
            <textarea name="note" placeholder="Issue areas, role, or context for the site admin"></textarea>
          </label>
          <button class="primary" type="submit">Submit request</button>
        </form>
      </div>
    </section>
  `, null);
}

async function renderApp(env: Env, user: User) {
  const memberships = await env.DB.prepare(
    `SELECT o.name, o.slug, m.role
     FROM organization_memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = ?
     ORDER BY o.name`
  )
    .bind(user.id)
    .all<{ name: string; slug: string; role: string }>();

  const postCounts = await env.DB.prepare(
    `SELECT section, COUNT(*) AS count
     FROM posts
     WHERE status = 'published'
     GROUP BY section`
  ).all<{ section: string; count: number }>();

  const countBySection = new Map(postCounts.results?.map((row) => [row.section, row.count]) ?? []);
  const orgItems = memberships.results?.length
    ? memberships.results
        .map((membership) => `<li><span class="mark">${escapeHtml(membership.role.slice(0, 1).toUpperCase())}</span><span><strong>${escapeHtml(membership.name)}</strong><br />${escapeHtml(membership.role)}</span></li>`)
        .join("")
    : `<li><span class="mark">!</span><span>No organization memberships yet. A site admin can attach your account to an organization.</span></li>`;

  return layout("Member dashboard", String.raw`
    <section class="dashboard">
      <div class="dashboard-hero panel">
        <div>
          <p class="eyebrow">Signed in as ${escapeHtml(user.email)}</p>
          <h1>Member dashboard</h1>
          <p class="lede">This is the protected app area. Future legislation notes, events, projects, comments, and organization tools will live behind this authorization boundary.</p>
        </div>
        <div class="stack">
          ${user.site_role === "site_admin" ? `<a class="button secondary" href="/admin">Admin tools</a>` : ""}
          <form method="post" action="/logout"><button class="danger" type="submit">Sign out</button></form>
        </div>
      </div>

      <section class="dashboard-grid" aria-label="Protected sections">
        <div class="tile"><strong>Legislation</strong><span>${countBySection.get("legislation") ?? 0} published notes</span></div>
        <div class="tile"><strong>Events</strong><span>${countBySection.get("event") ?? 0} published events</span></div>
        <div class="tile"><strong>Projects</strong><span>${countBySection.get("project") ?? 0} published projects</span></div>
      </section>

      <aside class="panel">
        <div class="panel-head">
          <h2>Your organizations</h2>
          <span class="badge">${memberships.results?.length ?? 0} linked</span>
        </div>
        <ul class="list">${orgItems}</ul>
      </aside>
    </section>
  `, user);
}

async function renderAdmin(env: Env, user: User) {
  const stats = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS count FROM users"),
    env.DB.prepare("SELECT COUNT(*) AS count FROM invitations WHERE accepted_at IS NULL"),
    env.DB.prepare("SELECT COUNT(*) AS count FROM sessions WHERE revoked_at IS NULL AND expires_at > ?").bind(new Date().toISOString()),
  ]);
  const organizations = await env.DB.prepare(
    `SELECT id, name, slug, contact_email, status
     FROM organizations
     ORDER BY name`
  ).all<{ id: string; name: string; slug: string; contact_email: string | null; status: string }>();
  const recentUsers = await env.DB.prepare(
    `SELECT u.email, u.name, u.site_role, u.status, GROUP_CONCAT(o.name || ' (' || m.role || ')', ', ') AS organizations
     FROM users u
     LEFT JOIN organization_memberships m ON m.user_id = u.id
     LEFT JOIN organizations o ON o.id = m.organization_id
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT 8`
  ).all<{ email: string; name: string | null; site_role: string; status: string; organizations: string | null }>();

  const users = Number((stats[0].results?.[0] as { count?: number } | undefined)?.count ?? 0);
  const invites = Number((stats[1].results?.[0] as { count?: number } | undefined)?.count ?? 0);
  const sessions = Number((stats[2].results?.[0] as { count?: number } | undefined)?.count ?? 0);
  const organizationOptions = organizations.results?.length
    ? organizations.results.map((organization) => `<option value="${escapeHtml(organization.id)}">${escapeHtml(organization.name)}</option>`).join("")
    : "";
  const organizationItems = organizations.results?.length
    ? organizations.results
        .map((organization) => `<li><strong>${escapeHtml(organization.name)}</strong><br /><span class="muted">${escapeHtml(organization.slug)}${organization.contact_email ? ` · ${escapeHtml(organization.contact_email)}` : ""} · ${escapeHtml(organization.status)}</span></li>`)
        .join("")
    : `<li><strong>No organizations yet</strong><br /><span class="muted">Create the first member organization with the form.</span></li>`;
  const userItems = recentUsers.results?.length
    ? recentUsers.results
        .map((member) => `<li><strong>${escapeHtml(member.name || member.email)}</strong><br /><span class="muted">${escapeHtml(member.email)} · ${escapeHtml(member.site_role)} · ${escapeHtml(member.status)}${member.organizations ? ` · ${escapeHtml(member.organizations)}` : ""}</span></li>`)
        .join("")
    : `<li><strong>No members yet</strong><br /><span class="muted">Invited members will appear here.</span></li>`;

  return layout("Admin tools", String.raw`
    <section class="dashboard">
      <div class="dashboard-hero panel">
        <div>
          <p class="eyebrow">Site admin</p>
          <h1>Admin tools</h1>
          <p class="lede">Create organizations, invite members, and assign the first roles that define who can participate in the ecosystem.</p>
        </div>
        <form method="post" action="/logout"><button class="danger" type="submit">Sign out</button></form>
      </div>

      <section class="dashboard-grid" aria-label="Admin stats">
        <div class="tile"><strong>Users</strong><span>${users} total accounts</span></div>
        <div class="tile"><strong>Open invites</strong><span>${invites} invite or review records</span></div>
        <div class="tile"><strong>Active sessions</strong><span>${sessions} unrevoked sessions</span></div>
      </section>

      <section class="admin-columns" aria-label="Onboarding forms">
        <div class="panel">
          <div class="panel-head">
            <h2>Create organization</h2>
            <span class="badge">Org profile</span>
          </div>
          <form method="post" action="/admin/organizations">
            <label>
              Organization name
              <input name="name" type="text" required />
            </label>
            <label>
              Slug
              <input name="slug" type="text" placeholder="generated from name if blank" />
            </label>
            <label>
              Contact email
              <input name="contact_email" type="email" />
            </label>
            <label>
              Summary
              <textarea name="summary" placeholder="Short description or issue areas"></textarea>
            </label>
            <button class="primary" type="submit">Create organization</button>
          </form>
        </div>

        <div class="panel">
          <div class="panel-head">
            <h2>Invite member</h2>
            <span class="badge">Magic link</span>
          </div>
          <form method="post" action="/admin/invitations">
            <label>
              Name
              <input name="name" type="text" />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Organization
              <select name="organization_id">
                <option value="">No organization yet</option>
                ${organizationOptions}
              </select>
            </label>
            <label>
              Organization role
              <select name="role">
                <option value="viewer">Viewer</option>
                <option value="contributor">Contributor</option>
                <option value="org_admin">Organization admin</option>
              </select>
            </label>
            <button class="primary" type="submit">Invite member</button>
          </form>
        </div>
      </section>

      <section class="admin-columns" aria-label="Onboarding lists">
        <aside class="panel">
          <div class="panel-head">
            <h2>Organizations</h2>
            <span class="badge">${organizations.results?.length ?? 0} total</span>
          </div>
          <ul class="compact-list">${organizationItems}</ul>
        </aside>
        <aside class="panel">
          <div class="panel-head">
            <h2>Recent members</h2>
            <span class="badge">${recentUsers.results?.length ?? 0} shown</span>
          </div>
          <ul class="compact-list">${userItems}</ul>
        </aside>
      </section>
    </section>
  `, user);
}

async function handleCreateOrganization(request: Request, env: Env, user: User) {
  const form = await request.formData();
  const name = cleanText(form.get("name"), 180);
  const slugInput = cleanText(form.get("slug"), 120);
  const contactEmail = normalizeOptionalEmail(form.get("contact_email"));
  const summary = cleanText(form.get("summary"), 500);
  const slug = slugify(slugInput || name);

  if (!name || !slug) {
    throw new HttpError(400, "Organization details required", "Organization name is required.");
  }

  const organizationId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO organizations (id, name, slug, summary, contact_email)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(organizationId, name, slug, summary || null, contactEmail || null)
    .run();

  await writeAudit(env, user.id, "organization.created", "organization", organizationId, { name, slug });
  return redirect("/admin");
}

async function handleAdminInvite(request: Request, env: Env, user: User) {
  const form = await request.formData();
  const email = normalizeEmail(form.get("email"));
  const name = cleanText(form.get("name"), 120);
  const organizationId = cleanText(form.get("organization_id"), 80);
  const role = cleanRole(form.get("role"));

  if (!email) {
    throw new HttpError(400, "Email required", "Enter the member email to invite.");
  }

  if (organizationId) {
    const organization = await env.DB.prepare("SELECT id FROM organizations WHERE id = ?")
      .bind(organizationId)
      .first<{ id: string }>();
    if (!organization) {
      throw new HttpError(400, "Organization not found", "Choose an existing organization.");
    }
  }

  let invitedUser = await env.DB.prepare("SELECT id, status FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string; status: string }>();

  if (!invitedUser) {
    const invitedUserId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users (id, email, name, site_role, status)
       VALUES (?, ?, ?, 'member', 'invited')`
    )
      .bind(invitedUserId, email, name || null)
      .run();
    invitedUser = { id: invitedUserId, status: "invited" };
  } else if (name) {
    await env.DB.prepare("UPDATE users SET name = COALESCE(name, ?), updated_at = ? WHERE id = ?")
      .bind(name, new Date().toISOString(), invitedUser.id)
      .run();
  }

  if (organizationId) {
    await env.DB.prepare(
      `INSERT INTO organization_memberships (organization_id, user_id, role)
       VALUES (?, ?, ?)
       ON CONFLICT(organization_id, user_id) DO UPDATE SET role = excluded.role`
    )
      .bind(organizationId, invitedUser.id, role)
      .run();
  }

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = daysFromNow(7);
  const invitationId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO invitations (id, email, organization_id, invited_role, token_hash, invited_by_user_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(invitationId, email, organizationId || null, role, tokenHash, user.id, expiresAt),
    env.DB.prepare(
      `INSERT INTO auth_tokens (id, email, token_hash, purpose, expires_at)
       VALUES (?, ?, ?, 'invite', ?)`
    ).bind(crypto.randomUUID(), email, tokenHash, expiresAt),
  ]);

  const verifyUrl = new URL("/auth/verify", request.url);
  verifyUrl.searchParams.set("token", token);
  await sendInviteEmail(env, email, verifyUrl.toString());

  await writeAudit(env, user.id, "member.invited", "user", invitedUser.id, {
    email,
    organization_id: organizationId || null,
    role,
  });

  return redirect("/admin");
}

async function handleSetupPage(env: Env, user: User | null) {
  if (user) {
    return redirect("/app");
  }

  const hasUsers = await userCount(env);
  if (hasUsers > 0) {
    return redirect("/login");
  }

  return html(layout("Create first admin", String.raw`
    <section class="auth-shell">
      <div class="auth-card">
        <p class="eyebrow">One-time setup</p>
        <h1>Create first admin</h1>
        <p class="lede">This route only works while the users table is empty. The first account becomes the site admin.</p>
        <form method="post" action="/setup">
          <label>
            Name
            <input name="name" type="text" autocomplete="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <button class="primary" type="submit">Create admin account</button>
        </form>
      </div>
    </section>
  `, null));
}

async function handleSetup(request: Request, env: Env) {
  if ((await userCount(env)) > 0) {
    throw new HttpError(403, "Setup is closed", "A site admin already exists. Use member sign in.");
  }

  const form = await request.formData();
  const email = normalizeEmail(form.get("email"));
  const name = cleanText(form.get("name"), 120);

  if (!email || !name) {
    throw new HttpError(400, "Missing setup details", "Name and email are required.");
  }

  const userId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, site_role, status)
     VALUES (?, ?, ?, 'site_admin', 'active')`
  )
    .bind(userId, email, name)
    .run();

  await writeAudit(env, userId, "setup.first_admin_created", "user", userId, { email });
  return createSessionRedirect(env, userId, "/app");
}

async function handleLogin(request: Request, env: Env) {
  const form = await request.formData();
  const email = normalizeEmail(form.get("email"));

  if (!email) {
    throw new HttpError(400, "Email required", "Enter the email connected to your member account.");
  }

  const user = await env.DB.prepare(
    "SELECT id, email, name, site_role, status FROM users WHERE email = ?"
  )
    .bind(email)
    .first<User>();

  if (!user || user.status === "suspended") {
    return html(layout("Sign-in requested", String.raw`
      <section class="auth-shell">
        <div class="auth-card">
          <p class="eyebrow">Sign-in requested</p>
          <h1>Check your email</h1>
          <p class="lede">If that address belongs to an approved account, a sign-in link will be sent.</p>
          <div class="notice">No account details are revealed here. New organizations can <a href="/request-invite">request an invite</a>.</div>
        </div>
      </section>
    `, null));
  }

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = minutesFromNow(TOKEN_MINUTES);

  await env.DB.prepare(
    `INSERT INTO auth_tokens (id, email, token_hash, purpose, expires_at)
     VALUES (?, ?, ?, 'login', ?)`
  )
    .bind(crypto.randomUUID(), email, tokenHash, expiresAt)
    .run();

  const verifyUrl = new URL("/auth/verify", request.url);
  verifyUrl.searchParams.set("token", token);
  await sendMagicLinkEmail(env, email, verifyUrl.toString());

  await writeAudit(env, user.id, "auth.magic_link_sent", "user", user.id, { email });

  return html(layout("Check your email", String.raw`
    <section class="auth-shell">
      <div class="auth-card">
        <p class="eyebrow">Magic link sent</p>
        <h1>Check your email</h1>
        <p class="lede">We sent a sign-in link to ${escapeHtml(email)}. It expires in ${TOKEN_MINUTES} minutes and can only be used once.</p>
        <div class="notice">For your security, this page no longer displays the sign-in token.</div>
      </div>
    </section>
  `, null));
}

async function sendMagicLinkEmail(env: Env, to: string, magicLink: string) {
  const subject = "Your NH Solidarity Ecosystem sign-in link";
  const text = [
    "Use this link to sign in to NH Solidarity Ecosystem:",
    "",
    magicLink,
    "",
    `This link expires in ${TOKEN_MINUTES} minutes and can only be used once.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const htmlBody = String.raw`
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.55;color:#10233f">
      <h1 style="font-size:24px;margin:0 0 12px">Sign in to NH Solidarity Ecosystem</h1>
      <p>Use the button below to open your member dashboard.</p>
      <p>
        <a href="${escapeHtml(magicLink)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1f67b1;color:#fff;text-decoration:none;font-weight:700">
          Sign in
        </a>
      </p>
      <p style="color:#5b6f88">This link expires in ${TOKEN_MINUTES} minutes and can only be used once.</p>
      <p style="color:#5b6f88">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  await env.EMAIL.send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html: htmlBody,
    text,
  });
}

async function sendInviteEmail(env: Env, to: string, magicLink: string) {
  const subject = "You are invited to NH Solidarity Ecosystem";
  const text = [
    "You have been invited to NH Solidarity Ecosystem.",
    "",
    "Use this link to activate your account and sign in:",
    "",
    magicLink,
    "",
    "This invitation link expires in 7 days and can only be used once.",
  ].join("\n");
  const htmlBody = String.raw`
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.55;color:#10233f">
      <h1 style="font-size:24px;margin:0 0 12px">You are invited</h1>
      <p>NH Solidarity Ecosystem is a secure member-only space for New Hampshire organizations to coordinate around legislation, events, and projects.</p>
      <p>
        <a href="${escapeHtml(magicLink)}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1f67b1;color:#fff;text-decoration:none;font-weight:700">
          Accept invite
        </a>
      </p>
      <p style="color:#5b6f88">This invitation link expires in 7 days and can only be used once.</p>
    </div>
  `;

  await env.EMAIL.send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html: htmlBody,
    text,
  });
}

async function handleVerify(url: URL, env: Env) {
  const token = url.searchParams.get("token") ?? "";
  if (!token) {
    throw new HttpError(400, "Invalid link", "The sign-in link is missing its token.");
  }

  const tokenHash = await sha256Hex(token);
  const now = new Date().toISOString();
  const tokenRow = await env.DB.prepare(
    `SELECT id, email, expires_at
     FROM auth_tokens
     WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?`
  )
    .bind(tokenHash, now)
    .first<{ id: string; email: string; expires_at: string }>();

  if (!tokenRow) {
    throw new HttpError(401, "Link expired", "This sign-in link is invalid, expired, or already used.");
  }

  const user = await env.DB.prepare(
    "SELECT id, email, name, site_role, status FROM users WHERE email = ?"
  )
    .bind(tokenRow.email)
    .first<User>();

  if (!user || user.status === "suspended") {
    throw new HttpError(403, "Access unavailable", "This account is not allowed to sign in.");
  }

  await env.DB.batch([
    env.DB.prepare("UPDATE auth_tokens SET consumed_at = ? WHERE id = ?").bind(now, tokenRow.id),
    env.DB.prepare("UPDATE users SET status = 'active', last_seen_at = ?, updated_at = ? WHERE id = ?").bind(now, now, user.id),
    env.DB.prepare("UPDATE invitations SET accepted_at = ? WHERE email = ? AND accepted_at IS NULL").bind(now, user.email),
  ]);

  await writeAudit(env, user.id, "auth.login", "user", user.id, { email: user.email });
  return createSessionRedirect(env, user.id, "/app");
}

async function handleInviteRequest(request: Request, env: Env) {
  const form = await request.formData();
  const email = normalizeEmail(form.get("email"));
  const organization = cleanText(form.get("organization"), 160);
  const note = cleanText(form.get("note"), 500);

  if (!email) {
    throw new HttpError(400, "Email required", "Enter the email address you would like reviewed.");
  }

  await env.DB.prepare(
    `INSERT INTO invitations (id, email, invited_role, token_hash, expires_at)
     VALUES (?, ?, 'viewer', ?, ?)`
  )
    .bind(crypto.randomUUID(), email, await sha256Hex(randomToken()), daysFromNow(30))
    .run();

  await writeAudit(env, null, "invite.requested", "invitation", email, { email, organization, note });

  return html(layout("Invite requested", String.raw`
    <section class="auth-shell">
      <div class="auth-card">
        <p class="eyebrow">Request received</p>
        <h1>Thanks</h1>
        <p class="lede">The request was recorded for admin review. Once approved, that email can receive a sign-in link.</p>
        <div class="actions"><a class="button secondary" href="/">Back home</a></div>
      </div>
    </section>
  `, null));
}

async function handleLogout(session: SessionContext, env: Env) {
  if (session.sessionId) {
    await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), await sha256Hex(session.sessionId))
      .run();
  }

  return redirect("/", {
    "Set-Cookie": clearSessionCookie(),
  });
}

async function createSessionRedirect(env: Env, userId: string, location: string) {
  const sessionId = randomToken();
  const sessionHash = await sha256Hex(sessionId);
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, expires_at)
     VALUES (?, ?, ?)`
  )
    .bind(sessionHash, userId, daysFromNow(SESSION_DAYS))
    .run();

  return redirect(location, {
    "Set-Cookie": sessionCookie(sessionId),
  });
}

async function getSession(request: Request, env: Env): Promise<SessionContext> {
  const sessionId = readCookie(request, SESSION_COOKIE);
  if (!sessionId) {
    return { user: null, sessionId: null };
  }

  const sessionHash = await sha256Hex(sessionId);
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.site_role, u.status
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?
       AND s.revoked_at IS NULL
       AND s.expires_at > ?
       AND u.status = 'active'`
  )
    .bind(sessionHash, new Date().toISOString())
    .first<User>();

  return { user: row ?? null, sessionId };
}

async function userCount(env: Env) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
  return Number(row?.count ?? 0);
}

function requireUser(user: User | null) {
  if (!user) {
    throw new RedirectError("/login");
  }
  return user;
}

function requireSiteAdmin(user: User) {
  if (user.site_role !== "site_admin") {
    throw new HttpError(403, "Admin only", "You need the site_admin role to open this page.");
  }
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) {
    return;
  }

  if (new URL(origin).host !== new URL(request.url).host) {
    throw new HttpError(403, "Blocked request", "The form origin did not match this site.");
  }
}

async function writeAudit(
  env: Env,
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  await env.DB.prepare(
    `INSERT INTO audit_log (id, actor_user_id, action, entity_type, entity_id, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(crypto.randomUUID(), actorUserId, action, entityType, entityId, JSON.stringify(metadata))
    .run();
}

function layout(title: string, body: string, user: User | null) {
  return String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | NH Solidarity Ecosystem</title>
    <meta
      name="description"
      content="A secure member-only community for New Hampshire organizations sharing legislation, events, projects, and mutual support."
    />
    <style>${baseStyles}</style>
  </head>
  <body>
    <main>
      ${renderNav(user)}
      ${body}
    </main>
  </body>
</html>`;
}

function renderNav(user: User | null) {
  return String.raw`
    <nav class="nav" aria-label="Site">
      <a class="brand" href="/">
        <span class="brand-mark">NH</span>
        <span>Solidarity Ecosystem</span>
      </a>
      <div class="nav-links" aria-label="Member navigation">
        <a href="/">Home</a>
        ${user ? `<a href="/app">Dashboard</a>` : `<a href="/login">Sign in</a>`}
        ${user?.site_role === "site_admin" ? `<a href="/admin">Admin</a>` : ""}
        ${!user ? `<a href="/request-invite">Request invite</a>` : `<span>${escapeHtml(user.email)}</span>`}
      </div>
    </nav>
  `;
}

function renderError(title: string, message: string) {
  return layout(title, String.raw`
    <section class="auth-shell">
      <div class="auth-card">
        <p class="eyebrow">Request stopped</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="lede">${escapeHtml(message)}</p>
        <div class="actions"><a class="button secondary" href="/">Back home</a></div>
      </div>
    </section>
  `, null);
}

function html(body: string, status = 200, headers: HeadersInit = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": "default-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      ...headers,
    },
  });
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function redirect(location: string, headers: HeadersInit = {}) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: location,
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function notFound() {
  return html(renderError("Page not found", "That route does not exist yet."), 404);
}

function normalizeEmail(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizeOptionalEmail(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }
  return normalizeEmail(value);
}

function cleanText(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, max);
}

function cleanRole(value: FormDataEntryValue | null) {
  if (value === "contributor" || value === "org_admin") {
    return value;
  }
  return "viewer";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("Cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) {
      return valueParts.join("=");
    }
  }
  return "";
}

function sessionCookie(sessionId: string) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly title: string,
    readonly message: string
  ) {
    super(message);
  }
}

class RedirectError extends Error {
  constructor(readonly location: string) {
    super(location);
  }
}
