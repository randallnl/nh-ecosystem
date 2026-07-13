interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  SCRAPER_API_TOKEN?: string;
  SCRAPER_ADMIN_TOKEN?: string;
  SCRAPER_RUN_URL?: string;
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

type MemberProfile = {
  id: string;
  email: string;
  name: string | null;
  avatar_object_key: string | null;
  profile_title: string | null;
  pronouns: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  profile_visibility: "members" | "hidden";
  site_role: "member" | "site_admin";
  status: "invited" | "active" | "suspended";
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
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

  .avatar {
    display: grid;
    width: 54px;
    height: 54px;
    place-items: center;
    flex: 0 0 auto;
    border-radius: var(--radius-pill);
    color: #ffffff;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    font-weight: 900;
    box-shadow: 0 14px 28px rgba(31, 103, 177, 0.18);
  }

  img.avatar {
    object-fit: cover;
  }

  .avatar.large {
    width: 86px;
    height: 86px;
    font-size: 1.38rem;
  }

  .member-card {
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }

  .profile-summary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 18px;
    align-items: start;
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

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .dashboard {
    display: grid;
    align-content: start;
    gap: 22px;
  }

  .content-page {
    width: min(920px, 100%);
    margin-inline: auto;
  }

  .dashboard-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.48fr);
    gap: 24px;
    padding: 26px;
    border-radius: var(--radius-xl);
  }

  .dashboard-hero > .stack {
    align-self: start;
    justify-items: end;
  }

  .dashboard-hero > .stack .button,
  .dashboard-hero > .stack button {
    min-height: 32px;
    padding: 6px 11px;
    font-size: 0.82rem;
    box-shadow: none;
  }

  .hero-preview {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    align-self: stretch;
  }

  .hero-preview-label {
    grid-column: 1 / -1;
    color: var(--muted);
    font-size: 0.84rem;
    font-weight: 850;
  }

  .post-preview {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid rgba(216, 228, 242, 0.74);
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.66);
  }

  .post-preview a {
    color: var(--accent);
    font-weight: 850;
    text-decoration: none;
  }

  .post-preview p {
    margin: 0;
  }

  .post-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(--radius-md);
  }

  .event-photo {
    display: block;
    width: 100%;
    max-height: 360px;
    object-fit: contain;
    border-radius: var(--radius-md);
  }

  .event-detail-title {
    max-width: 860px;
    font-size: clamp(2.2rem, 5vw, 4.4rem);
    line-height: 0.98;
  }

  .event-detail-body {
    display: grid;
    grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.15fr);
    gap: 22px;
    align-items: start;
    margin-top: 18px;
  }

  .event-detail-copy {
    min-width: 0;
  }

  .event-detail-copy .lede {
    margin-top: 0;
  }

  .org-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .org-logo {
    width: 22px;
    height: 22px;
    object-fit: contain;
    border-radius: var(--radius-pill);
  }

  .org-logo.large {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg);
  }

  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .section-feed {
    display: grid;
    gap: 18px;
  }

  .composer-panel {
    padding: 18px;
  }

  .composer {
    margin-top: 0;
  }

  .composer input[name="title"] {
    min-height: 56px;
    border-radius: var(--radius-pill);
    padding-inline: 18px;
    font-weight: 750;
  }

  .composer-extra {
    display: none;
    gap: 14px;
  }

  .composer:focus-within .composer-extra {
    display: grid;
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

  .compact-list li.with-image {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }

  .list-thumb {
    width: 100%;
    height: 135px;
    object-fit: cover;
    border-radius: var(--radius-md);
  }

  .list-copy {
    display: grid;
    gap: 8px;
  }

  .list-copy p {
    margin: 0;
  }

  .review-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .review-actions form {
    margin: 0;
  }

  .compact-list a,
  .tile a {
    color: var(--accent);
    font-weight: 800;
  }

  .post-body {
    white-space: pre-wrap;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
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
      grid-template-columns: 1fr;
    }

    .hero-preview {
      grid-template-columns: 1fr;
    }

    .admin-columns {
      grid-template-columns: 1fr;
    }

    .event-detail-body {
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

    .compact-list li.with-image {
      grid-template-columns: 1fr;
    }

    .list-thumb {
      height: 135px;
    }
  }
`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      const session = await getSession(request, env);

      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, authenticated: Boolean(session.user) });
      }

      if (request.method === "GET" && url.pathname === "/api/scraper/organizations") {
        return handleScraperOrganizations(request, env);
      }

      if (request.method === "POST" && url.pathname === "/api/scraper/events") {
        return handleScraperEvents(request, env);
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

      if (request.method === "GET" && url.pathname === "/profile") {
        const user = requireUser(session.user);
        return html(await renderEditOwnProfile(env, user));
      }

      if (request.method === "POST" && url.pathname === "/profile") {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        return handleUpdateOwnProfile(request, env, user);
      }

      if (request.method === "GET" && (url.pathname.startsWith("/media/org-logos/") || url.pathname.startsWith("/media/profile-photos/"))) {
        requireUser(session.user);
        return handleMediaObject(request, env);
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

      if (request.method === "POST" && url.pathname === "/admin/scraper/run") {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        requireSiteAdmin(user);
        return handleRunScraper(env, user);
      }

      if (request.method === "GET" && url.pathname.startsWith("/admin/users/")) {
        const user = requireUser(session.user);
        requireSiteAdmin(user);
        const userId = decodeURIComponent(url.pathname.replace("/admin/users/", "")).split("/")[0];
        return html(await renderAdminUserProfile(env, user, userId));
      }

      if (request.method === "POST" && url.pathname.startsWith("/admin/users/")) {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        requireSiteAdmin(user);
        const userId = decodeURIComponent(url.pathname.replace("/admin/users/", "")).split("/")[0];
        return handleUpdateUserProfile(request, env, user, userId);
      }

      const section = sectionFromPath(url.pathname);
      if (request.method === "GET" && section) {
        const user = requireUser(session.user);
        return html(await renderSectionPage(env, user, section));
      }

      if (request.method === "POST" && url.pathname === "/posts") {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        return handleCreatePost(request, env, user);
      }

      if (request.method === "POST" && url.pathname.startsWith("/posts/") && url.pathname.endsWith("/approve")) {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        const postId = decodeURIComponent(url.pathname.replace("/posts/", "").replace("/approve", "")).split("/")[0];
        return handleApproveEvent(request, env, user, postId);
      }

      if (request.method === "POST" && url.pathname.startsWith("/posts/") && url.pathname.endsWith("/reject")) {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        const postId = decodeURIComponent(url.pathname.replace("/posts/", "").replace("/reject", "")).split("/")[0];
        return handleRejectEvent(request, env, user, postId);
      }

      if (request.method === "GET" && url.pathname.startsWith("/posts/") && url.pathname.endsWith("/edit")) {
        const user = requireUser(session.user);
        const postId = decodeURIComponent(url.pathname.replace("/posts/", "").replace("/edit", "")).split("/")[0];
        return html(await renderEventEditPage(env, user, postId));
      }

      if (request.method === "POST" && url.pathname.startsWith("/posts/") && url.pathname.endsWith("/edit")) {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        const postId = decodeURIComponent(url.pathname.replace("/posts/", "").replace("/edit", "")).split("/")[0];
        return handleUpdateEvent(request, env, user, postId);
      }

      if (request.method === "POST" && url.pathname.startsWith("/posts/") && url.pathname.endsWith("/delete")) {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        const postId = decodeURIComponent(url.pathname.replace("/posts/", "").replace("/delete", "")).split("/")[0];
        return handleRemoveEvent(env, user, postId);
      }

      if (request.method === "GET" && url.pathname.startsWith("/posts/")) {
        const user = requireUser(session.user);
        const postId = decodeURIComponent(url.pathname.replace("/posts/", "")).split("/")[0];
        return html(await renderPostDetail(env, user, postId));
      }

      if (request.method === "POST" && url.pathname.startsWith("/posts/") && url.pathname.endsWith("/comments")) {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        const postId = decodeURIComponent(url.pathname.replace("/posts/", "").replace("/comments", "")).split("/")[0];
        return handleCreateComment(request, env, user, postId);
      }

      if (request.method === "GET" && url.pathname === "/members") {
        const user = requireUser(session.user);
        return html(await renderMemberDirectory(env, user));
      }

      if (request.method === "GET" && url.pathname.startsWith("/members/")) {
        const user = requireUser(session.user);
        const memberId = decodeURIComponent(url.pathname.replace("/members/", "")).split("/")[0];
        return html(await renderMemberProfile(env, user, memberId));
      }

      if (request.method === "GET" && url.pathname.startsWith("/organizations/")) {
        const user = requireUser(session.user);
        const slug = decodeURIComponent(url.pathname.replace("/organizations/", "")).split("/")[0];
        return html(await renderOrganizationProfile(env, user, slug));
      }

      if (request.method === "POST" && url.pathname.startsWith("/organizations/")) {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        const slug = decodeURIComponent(url.pathname.replace("/organizations/", "")).split("/")[0];
        return handleUpdateOrganization(request, env, user, slug);
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
        <p class="lede">Enter the email connected to your approved member account. We will send a short-lived magic link to your inbox.</p>
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
    `SELECT o.name, o.slug, o.summary, o.contact_email, o.website_url, o.logo_object_key, m.role
     FROM organization_memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = ?
     ORDER BY o.name`
  )
    .bind(user.id)
    .all<{ name: string; slug: string; summary: string | null; contact_email: string | null; website_url: string | null; logo_object_key: string | null; role: string }>();

  const postCounts = await env.DB.prepare(
    `SELECT section, COUNT(*) AS count
     FROM posts
     WHERE status = 'published'
     GROUP BY section`
  ).all<{ section: string; count: number }>();
  const recentPosts = await env.DB.prepare(
    `SELECT p.id, p.section, p.title, p.body, p.created_at, o.name AS organization_name, o.logo_object_key AS organization_logo_object_key,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'published') AS comment_count
     FROM posts p
     LEFT JOIN organizations o ON o.id = p.organization_id
     WHERE p.status = 'published'
     ORDER BY comment_count DESC, p.created_at DESC
     LIMIT 6`
  ).all<{ id: string; section: string; title: string; body: string; created_at: string; organization_name: string | null; organization_logo_object_key: string | null; comment_count: number }>();

  const countBySection = new Map(postCounts.results?.map((row) => [row.section, row.count]) ?? []);
  const orgCards = memberships.results?.length
    ? memberships.results
        .map((membership) => String.raw`
          <div class="tile">
            <strong>${renderOrganizationPill(membership.name, membership.logo_object_key)}</strong>
            <span>${escapeHtml(membership.summary || "Profile details are still being filled in.")}</span>
            <div class="status">
              <span>${escapeHtml(formatRole(membership.role))}</span>
              ${membership.contact_email ? `<span>${escapeHtml(membership.contact_email)}</span>` : ""}
            </div>
            <div class="actions">
              <a class="button secondary" href="/organizations/${escapeHtml(membership.slug)}">Open profile</a>
            </div>
          </div>
        `)
        .join("")
    : `<div class="tile"><strong>No organization memberships yet</strong><span>A site admin can attach your account to an organization.</span></div>`;
  const recentPostItems = recentPosts.results?.length
    ? recentPosts.results
        .map((post) => `<li><strong><a href="/posts/${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></strong><br /><span class="muted">${escapeHtml(sectionLabel(post.section))}${post.organization_name ? ` · ${escapeHtml(post.organization_name)}` : ""} · ${escapeHtml(formatDate(post.created_at))}</span></li>`)
        .join("")
    : `<li><strong>No posts yet</strong><br /><span class="muted">Create the first legislation note, event, project, or update from a section page.</span></li>`;
  const heroPreviews = renderHeroPreviews(recentPosts.results ?? []);

  return layout("Member dashboard", String.raw`
    <section class="dashboard">
      <div class="dashboard-hero panel">
        <div>
          <p class="eyebrow">Signed in as ${escapeHtml(user.email)}</p>
          <h1>Member dashboard</h1>
          <p class="lede">This is the protected app area. Future legislation notes, events, projects, comments, and organization tools will live behind this authorization boundary.</p>
        </div>
        <div class="stack">
          <a class="button secondary" href="/profile">Edit profile</a>
          ${user.site_role === "site_admin" ? `<a class="button secondary" href="/admin">Admin tools</a>` : ""}
          <form method="post" action="/logout"><button class="danger" type="submit">Sign out</button></form>
        </div>
        ${heroPreviews}
      </div>

      <section class="dashboard-grid" aria-label="Protected sections">
        <div class="tile"><strong><a href="/legislation">Legislation</a></strong><span>${countBySection.get("legislation") ?? 0} published notes</span></div>
        <div class="tile"><strong><a href="/events">Events</a></strong><span>${countBySection.get("event") ?? 0} published events</span></div>
        <div class="tile"><strong><a href="/projects">Projects</a></strong><span>${countBySection.get("project") ?? 0} published projects</span></div>
        <div class="tile"><strong><a href="/updates">Updates</a></strong><span>${countBySection.get("update") ?? 0} published updates</span></div>
      </section>

      <aside class="panel">
        <div class="panel-head">
          <h2>Recent activity</h2>
          <span class="badge">${recentPosts.results?.length ?? 0} shown</span>
        </div>
        <ul class="compact-list">${recentPostItems}</ul>
      </aside>

      <aside class="panel">
        <div class="panel-head">
          <h2>Your organizations</h2>
          <span class="badge">${memberships.results?.length ?? 0} linked</span>
        </div>
        <div class="dashboard-grid">${orgCards}</div>
      </aside>
    </section>
  `, user);
}

async function renderSectionPage(env: Env, user: User, section: string) {
  const meta = sectionMeta(section);
  const [posts, writableOrganizations] = await Promise.all([
    env.DB.prepare(
      `SELECT p.id, p.title, p.body, p.created_at, p.organization_id, o.name AS organization_name, o.slug AS organization_slug,
        o.logo_object_key AS organization_logo_object_key, u.name AS author_name, u.email AS author_email,
        e.image_url,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'published') AS comment_count
       FROM posts p
       LEFT JOIN organizations o ON o.id = p.organization_id
       LEFT JOIN events e ON e.post_id = p.id
       JOIN users u ON u.id = p.author_user_id
       WHERE p.section = ? AND p.status = 'published'
       ORDER BY p.created_at DESC
       LIMIT 40`
    ).bind(section).all<{
      id: string;
      title: string;
      body: string;
      created_at: string;
      organization_id: string | null;
      organization_name: string | null;
      organization_slug: string | null;
      organization_logo_object_key: string | null;
      author_name: string | null;
      author_email: string;
      image_url: string | null;
      comment_count: number;
    }>(),
    getWritableOrganizations(env, user),
  ]);

  const canCreate = user.site_role === "site_admin" || writableOrganizations.length > 0;
  const postItems = posts.results?.length
    ? posts.results
        .map((post) => String.raw`
          <li class="${post.image_url ? "with-image" : ""}">
            ${post.image_url ? `<img class="list-thumb" src="${escapeHtml(post.image_url)}" alt="" loading="lazy" />` : ""}
            <div class="list-copy">
              <strong><a href="/posts/${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></strong>
              <p class="muted">${escapeHtml(excerpt(post.body, 180))}</p>
              <div class="meta">
                ${post.organization_name ? renderOrganizationPill(post.organization_name, post.organization_logo_object_key) : `<span class="badge">Ecosystem-wide</span>`}
                <span class="badge">${escapeHtml(formatDate(post.created_at))}</span>
                <span class="badge">${Number(post.comment_count)} comments</span>
              </div>
            </div>
          </li>
        `)
        .join("")
    : `<li><strong>No ${escapeHtml(meta.pluralLower)} yet</strong><br /><span class="muted">When members publish here, the latest posts will appear in this section.</span></li>`;
  const heroPreviews = renderHeroPreviews(posts.results ?? []);

  return layout(meta.title, String.raw`
    <section class="dashboard content-page">
      <div class="dashboard-hero panel">
        <div>
          <p class="eyebrow">Member section</p>
          <h1>${escapeHtml(meta.title)}</h1>
          <p class="lede">${escapeHtml(meta.description)}</p>
        </div>
        ${heroPreviews}
      </div>

      <section class="section-feed">
        <aside class="panel composer-panel">
          <div class="panel-head">
            <h2>Create ${escapeHtml(meta.singularLower)}</h2>
            <span class="badge">${canCreate ? "Available" : "Contributor role needed"}</span>
          </div>
          ${canCreate ? renderPostForm(section, writableOrganizations, user) : `<p class="muted">Ask an organization admin or site admin to give you contributor access before posting.</p>`}
        </aside>

        <aside class="panel">
          <div class="panel-head">
            <h2>Recent ${escapeHtml(meta.pluralLower)}</h2>
            <span class="badge">${posts.results?.length ?? 0} shown</span>
          </div>
          <ul class="compact-list">${postItems}</ul>
        </aside>
      </section>
    </section>
  `, user);
}

function renderHeroPreviews(
  posts: Array<{ id: string; title: string; body?: string; section?: string; organization_name?: string | null; organization_logo_object_key?: string | null; comment_count?: number; image_url?: string | null }>
) {
  if (!posts.length) {
    return "";
  }
  const activePosts = [...posts]
    .sort((a, b) => Number(b.comment_count ?? 0) - Number(a.comment_count ?? 0))
    .slice(0, 3);
  return String.raw`
    <div class="hero-preview">
      <strong class="hero-preview-label">Active threads</strong>
      ${activePosts
        .map((post) => String.raw`
          <div class="post-preview">
            ${post.image_url ? `<img class="post-image" src="${escapeHtml(post.image_url)}" alt="" loading="lazy" />` : ""}
            <a href="/posts/${escapeHtml(post.id)}">${escapeHtml(post.title)}</a>
            <p class="muted">${post.organization_name ? `${escapeHtml(post.organization_name)} · ` : ""}${Number(post.comment_count ?? 0)} comments${post.section ? ` · ${escapeHtml(sectionLabel(post.section))}` : ""}</p>
          </div>
        `)
        .join("")}
    </div>
  `;
}

function renderPostForm(section: string, organizations: Array<{ id: string; name: string }>, user: User) {
  const organizationOptions = [
    ...(user.site_role === "site_admin" ? [`<option value="">Ecosystem-wide</option>`] : []),
    ...organizations.map((organization) => `<option value="${escapeHtml(organization.id)}">${escapeHtml(organization.name)}</option>`),
  ].join("");

  return String.raw`
    <form class="composer" method="post" action="/posts">
      <input name="section" type="hidden" value="${escapeHtml(section)}" />
      <label>
        <span class="sr-only">Title</span>
        <input name="title" type="text" required placeholder="Create ${escapeHtml(sectionMeta(section).singularLower)}" />
      </label>
      <div class="composer-extra">
        <label>
          Organization
          <select name="organization_id" ${organizationOptions ? "" : "disabled"}>
            ${organizationOptions}
          </select>
        </label>
        <label>
          Body
          <textarea name="body" required placeholder="Share the context, ask, update, or next step."></textarea>
        </label>
        <button class="primary" type="submit">Publish</button>
      </div>
    </form>
  `;
}

async function renderPostDetail(env: Env, user: User, postId: string) {
  const post = await env.DB.prepare(
    `SELECT p.id, p.section, p.title, p.body, p.visibility, p.status, p.created_at, p.organization_id,
      e.starts_at, e.ends_at, e.location_name, e.registration_url, e.external_url, e.image_url,
      o.name AS organization_name, o.slug AS organization_slug, o.logo_object_key AS organization_logo_object_key,
      u.name AS author_name, u.email AS author_email
     FROM posts p
     LEFT JOIN events e ON e.post_id = p.id
     LEFT JOIN organizations o ON o.id = p.organization_id
     JOIN users u ON u.id = p.author_user_id
     WHERE p.id = ?`
  )
    .bind(postId)
    .first<{
      id: string;
      section: string;
      title: string;
      body: string;
      visibility: string;
      status: string;
      created_at: string;
      organization_id: string | null;
      starts_at: string | null;
      ends_at: string | null;
      location_name: string | null;
      registration_url: string | null;
      external_url: string | null;
      image_url: string | null;
      organization_name: string | null;
      organization_slug: string | null;
      organization_logo_object_key: string | null;
      author_name: string | null;
      author_email: string;
    }>();

  if (!post || post.status !== "published") {
    throw new HttpError(404, "Post not found", "That post does not exist or is not published.");
  }

  await requireCanReadPost(env, user, post.organization_id, post.visibility);
  const canEditEvent = post.section === "event" && await canManageEvent(env, user, post.organization_id);

  const comments = await env.DB.prepare(
    `SELECT c.id, c.body, c.created_at, u.name AS author_name, u.email AS author_email
     FROM comments c
     JOIN users u ON u.id = c.author_user_id
     WHERE c.post_id = ? AND c.status = 'published'
     ORDER BY c.created_at`
  )
    .bind(post.id)
    .all<{ id: string; body: string; created_at: string; author_name: string | null; author_email: string }>();
  const commentItems = comments.results?.length
    ? comments.results
        .map((comment) => `<li><strong>${escapeHtml(comment.author_name || comment.author_email)}</strong><br /><span class="muted">${escapeHtml(formatDate(comment.created_at))}</span><p class="post-body">${escapeHtml(comment.body)}</p></li>`)
        .join("")
    : `<li><strong>No comments yet</strong><br /><span class="muted">Start the discussion below.</span></li>`;
  const meta = sectionMeta(post.section);

  return layout(post.title, String.raw`
    <section class="dashboard content-page">
      <article class="panel">
        <div class="panel-head">
          <h2>${escapeHtml(meta.title)}</h2>
          <span class="badge">${escapeHtml(formatDate(post.created_at))}</span>
        </div>
        <h1 class="event-detail-title">${escapeHtml(post.title)}</h1>
        <div class="meta">
          ${post.organization_name ? renderOrganizationPill(post.organization_name, post.organization_logo_object_key) : `<span class="badge">Ecosystem-wide</span>`}
          <span class="badge">${escapeHtml(post.author_name || post.author_email)}</span>
          ${post.starts_at ? `<span class="badge">${escapeHtml(formatDate(post.starts_at))}</span>` : ""}
          ${post.location_name ? `<span class="badge">${escapeHtml(post.location_name)}</span>` : ""}
        </div>
        <div class="event-detail-body">
          ${post.image_url ? `<img class="event-photo" src="${escapeHtml(post.image_url)}" alt="" loading="lazy" />` : ""}
          <div class="event-detail-copy">
            <p class="post-body lede">${escapeHtml(post.body)}</p>
          </div>
        </div>
        <div class="actions">
          <a class="button secondary" href="${escapeHtml(meta.path)}">Back to ${escapeHtml(meta.title)}</a>
          ${post.organization_slug ? `<a class="button secondary" href="/organizations/${escapeHtml(post.organization_slug)}">Organization profile</a>` : ""}
          ${canEditEvent ? `<a class="button primary" href="/posts/${escapeHtml(post.id)}/edit">Edit event</a>` : ""}
          ${post.registration_url ? `<a class="button secondary" href="${escapeHtml(post.registration_url)}">Event page</a>` : ""}
          ${!post.registration_url && post.external_url ? `<a class="button secondary" href="${escapeHtml(post.external_url)}">Event page</a>` : ""}
          ${canEditEvent ? `<form method="post" action="/posts/${escapeHtml(post.id)}/delete"><button class="danger" type="submit">Remove event</button></form>` : ""}
        </div>
      </article>

      <section class="section-feed">
        <aside class="panel">
          <div class="panel-head">
            <h2>Add comment</h2>
            <span class="badge">Members</span>
          </div>
          <form method="post" action="/posts/${escapeHtml(post.id)}/comments">
            <label>
              Comment
              <textarea name="body" required></textarea>
            </label>
            <button class="primary" type="submit">Comment</button>
          </form>
        </aside>

        <aside class="panel">
          <div class="panel-head">
            <h2>Comments</h2>
            <span class="badge">${comments.results?.length ?? 0} total</span>
          </div>
          <ul class="compact-list">${commentItems}</ul>
        </aside>
      </section>
    </section>
  `, user);
}

async function renderEventEditPage(env: Env, user: User, postId: string) {
  const post = await env.DB.prepare(
    `SELECT p.id, p.title, p.body, p.section, p.status, p.organization_id,
      e.starts_at, e.ends_at, e.location_name, e.registration_url, e.external_url, e.source_url, e.image_url,
      o.name AS organization_name, o.slug AS organization_slug
     FROM posts p
     LEFT JOIN events e ON e.post_id = p.id
     LEFT JOIN organizations o ON o.id = p.organization_id
     WHERE p.id = ?`
  )
    .bind(postId)
    .first<{
      id: string;
      title: string;
      body: string;
      section: string;
      status: string;
      organization_id: string | null;
      starts_at: string | null;
      ends_at: string | null;
      location_name: string | null;
      registration_url: string | null;
      external_url: string | null;
      source_url: string | null;
      image_url: string | null;
      organization_name: string | null;
      organization_slug: string | null;
    }>();

  if (!post || post.status !== "published" || post.section !== "event") {
    throw new HttpError(404, "Event not found", "That event does not exist or is not editable.");
  }

  await requireCanManageEvent(env, user, post.organization_id);

  return layout(`Edit ${post.title}`, String.raw`
    <section class="dashboard">
      <div class="dashboard-hero panel">
        <div>
          <p class="eyebrow">Event editor</p>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="lede">Update event details, links, and display information.</p>
          <div class="status">
            ${post.organization_name ? `<span>${escapeHtml(post.organization_name)}</span>` : `<span>Ecosystem-wide</span>`}
            ${post.starts_at ? `<span>${escapeHtml(formatDate(post.starts_at))}</span>` : ""}
          </div>
        </div>
        <div class="stack">
          <a class="button secondary" href="/posts/${escapeHtml(post.id)}">Back to event</a>
          ${post.organization_slug ? `<a class="button secondary" href="/organizations/${escapeHtml(post.organization_slug)}">Organization profile</a>` : ""}
        </div>
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2>Event details</h2>
          <span class="badge">Editable</span>
        </div>
        <form method="post" action="/posts/${escapeHtml(post.id)}/edit">
          <label>
            Title
            <input name="title" type="text" value="${escapeHtml(post.title)}" required />
          </label>
          <label>
            Description
            <textarea name="body" required>${escapeHtml(post.body)}</textarea>
          </label>
          <label>
            Starts at
            <input name="starts_at" type="datetime-local" value="${escapeHtml(toDateTimeLocal(post.starts_at))}" required />
          </label>
          <label>
            Ends at
            <input name="ends_at" type="datetime-local" value="${escapeHtml(toDateTimeLocal(post.ends_at))}" />
          </label>
          <label>
            Location
            <input name="location_name" type="text" value="${escapeHtml(post.location_name || "")}" />
          </label>
          <label>
            Event Page URL
            <input name="registration_url" type="url" value="${escapeHtml(post.registration_url || post.external_url || "")}" />
          </label>
          <label>
            Source URL
            <input name="source_url" type="url" value="${escapeHtml(post.source_url || "")}" />
          </label>
          <label>
            Photo URL
            <input name="image_url" type="url" value="${escapeHtml(post.image_url || "")}" />
          </label>
          <button class="primary" type="submit">Update event</button>
        </form>
      </section>
    </section>
  `, user);
}

async function handleUpdateEvent(request: Request, env: Env, user: User, postId: string) {
  const post = await env.DB.prepare(
    "SELECT id, section, status, organization_id FROM posts WHERE id = ?"
  )
    .bind(postId)
    .first<{ id: string; section: string; status: string; organization_id: string | null }>();

  if (!post || post.status !== "published" || post.section !== "event") {
    throw new HttpError(404, "Event not found", "That event does not exist or is not editable.");
  }

  await requireCanManageEvent(env, user, post.organization_id);

  const form = await request.formData();
  const title = cleanText(form.get("title"), 220);
  const body = cleanText(form.get("body"), 6000);
  const startsAt = cleanDateTimeLocal(form.get("starts_at"));
  const endsAt = cleanOptionalDateTimeLocal(form.get("ends_at"));
  const locationName = cleanText(form.get("location_name"), 500);
  const registrationUrl = normalizeOptionalUrl(form.get("registration_url"));
  const sourceUrl = normalizeOptionalUrl(form.get("source_url"));
  const imageUrl = normalizeOptionalUrl(form.get("image_url"));

  if (!title || !body || !startsAt) {
    throw new HttpError(400, "Event details required", "Enter a title, description, and start date/time.");
  }

  if (endsAt && endsAt < startsAt) {
    throw new HttpError(400, "Event dates invalid", "The end date/time must be after the start date/time.");
  }

  await env.DB.batch([
    env.DB.prepare(
      "UPDATE posts SET title = ?, body = ?, updated_at = ? WHERE id = ?"
    ).bind(title, body, new Date().toISOString(), post.id),
    env.DB.prepare(
      `INSERT INTO events (post_id, starts_at, ends_at, location_name, registration_url, source_url, external_url, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(post_id) DO UPDATE SET starts_at = excluded.starts_at, ends_at = excluded.ends_at,
         location_name = excluded.location_name, registration_url = excluded.registration_url,
         source_url = excluded.source_url, external_url = excluded.external_url, image_url = excluded.image_url`
    ).bind(
      post.id,
      startsAt,
      endsAt || null,
      locationName || null,
      registrationUrl || null,
      sourceUrl || null,
      registrationUrl || null,
      imageUrl || null
    ),
  ]);

  await writeAudit(env, user.id, "event.updated", "post", post.id, {
    organization_id: post.organization_id || null,
  });

  return redirect(`/posts/${post.id}`);
}

async function handleRemoveEvent(env: Env, user: User, postId: string) {
  const post = await env.DB.prepare(
    "SELECT id, section, status, organization_id FROM posts WHERE id = ?"
  )
    .bind(postId)
    .first<{ id: string; section: string; status: string; organization_id: string | null }>();

  if (!post || post.status !== "published" || post.section !== "event") {
    throw new HttpError(404, "Event not found", "That event does not exist or is not removable.");
  }

  await requireCanManageEvent(env, user, post.organization_id);

  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE posts SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ?"
  )
    .bind(now, now, post.id)
    .run();

  await writeAudit(env, user.id, "event.removed", "post", post.id, {
    organization_id: post.organization_id || null,
  });

  return redirect("/events");
}

async function handleApproveEvent(request: Request, env: Env, user: User, postId: string) {
  const post = await getModeratableEvent(env, postId, "draft");
  await requireCanManageEvent(env, user, post.organization_id);
  const returnTo = await reviewReturnPath(request);

  await env.DB.prepare(
    "UPDATE posts SET status = 'published', archived_at = NULL, updated_at = ? WHERE id = ?"
  )
    .bind(new Date().toISOString(), post.id)
    .run();
  await writeAudit(env, user.id, "event.approved", "post", post.id, {
    organization_id: post.organization_id || null,
  });
  return redirect(returnTo);
}

async function handleRejectEvent(request: Request, env: Env, user: User, postId: string) {
  const post = await getModeratableEvent(env, postId, "draft");
  await requireCanManageEvent(env, user, post.organization_id);
  const returnTo = await reviewReturnPath(request);

  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE posts SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ?"
  )
    .bind(now, now, post.id)
    .run();
  await writeAudit(env, user.id, "event.rejected", "post", post.id, {
    organization_id: post.organization_id || null,
  });
  return redirect(returnTo);
}

async function handleCreatePost(request: Request, env: Env, user: User) {
  const form = await request.formData();
  const section = cleanSection(form.get("section"));
  const organizationId = cleanText(form.get("organization_id"), 80);
  const title = cleanText(form.get("title"), 220);
  const body = cleanText(form.get("body"), 6000);

  if (!section || !title || !body) {
    throw new HttpError(400, "Post details required", "Choose a section and include a title and body.");
  }

  if (!organizationId && user.site_role !== "site_admin") {
    throw new HttpError(403, "Organization required", "Choose an organization you can post for.");
  }

  if (organizationId) {
    await requireCanPostForOrganization(env, user, organizationId);
  }

  const postId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO posts (id, organization_id, author_user_id, section, title, body, visibility, status)
     VALUES (?, ?, ?, ?, ?, ?, 'members', 'published')`
  )
    .bind(postId, organizationId || null, user.id, section, title, body)
    .run();

  await writeAudit(env, user.id, "post.created", "post", postId, { section, organization_id: organizationId || null });
  return redirect(`/posts/${postId}`);
}

async function handleCreateComment(request: Request, env: Env, user: User, postId: string) {
  const post = await env.DB.prepare("SELECT id, organization_id, visibility, status FROM posts WHERE id = ?")
    .bind(postId)
    .first<{ id: string; organization_id: string | null; visibility: string; status: string }>();

  if (!post || post.status !== "published") {
    throw new HttpError(404, "Post not found", "That post does not exist or is not published.");
  }

  await requireCanReadPost(env, user, post.organization_id, post.visibility);

  const form = await request.formData();
  const body = cleanText(form.get("body"), 3000);
  if (!body) {
    throw new HttpError(400, "Comment required", "Write a comment before submitting.");
  }

  const commentId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO comments (id, post_id, author_user_id, body)
     VALUES (?, ?, ?, ?)`
  )
    .bind(commentId, post.id, user.id, body)
    .run();

  await writeAudit(env, user.id, "comment.created", "comment", commentId, { post_id: post.id });
  return redirect(`/posts/${post.id}`);
}

async function renderAdmin(env: Env, user: User) {
  const stats = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS count FROM users"),
    env.DB.prepare("SELECT COUNT(*) AS count FROM invitations WHERE accepted_at IS NULL"),
    env.DB.prepare("SELECT COUNT(*) AS count FROM sessions WHERE revoked_at IS NULL AND expires_at > ?").bind(new Date().toISOString()),
  ]);
  const organizations = await env.DB.prepare(
    `SELECT id, name, slug, contact_email, status, event_source_url, event_scraping_enabled
     FROM organizations
     ORDER BY name`
  ).all<{ id: string; name: string; slug: string; contact_email: string | null; status: string; event_source_url: string | null; event_scraping_enabled: number }>();
  const recentUsers = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.site_role, u.status, GROUP_CONCAT(o.name || ' (' || m.role || ')', ', ') AS organizations
     FROM users u
     LEFT JOIN organization_memberships m ON m.user_id = u.id
     LEFT JOIN organizations o ON o.id = m.organization_id
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT 8`
  ).all<{ id: string; email: string; name: string | null; site_role: string; status: string; organizations: string | null }>();
  const pendingEvents = await getPendingEvents(env, user);

  const users = Number((stats[0].results?.[0] as { count?: number } | undefined)?.count ?? 0);
  const invites = Number((stats[1].results?.[0] as { count?: number } | undefined)?.count ?? 0);
  const sessions = Number((stats[2].results?.[0] as { count?: number } | undefined)?.count ?? 0);
  const organizationOptions = organizations.results?.length
    ? organizations.results.map((organization) => `<option value="${escapeHtml(organization.id)}">${escapeHtml(organization.name)}</option>`).join("")
    : "";
  const organizationItems = organizations.results?.length
    ? organizations.results
        .map((organization) => `<li><strong><a href="/organizations/${escapeHtml(organization.slug)}">${escapeHtml(organization.name)}</a></strong><br /><span class="muted">${escapeHtml(organization.slug)}${organization.contact_email ? ` · ${escapeHtml(organization.contact_email)}` : ""} · ${escapeHtml(organization.status)}${organization.event_source_url ? ` · Event Page URL set` : ""}${organization.event_scraping_enabled ? " · scraping enabled" : ""}</span></li>`)
        .join("")
    : `<li><strong>No organizations yet</strong><br /><span class="muted">Create the first member organization with the form.</span></li>`;
  const userItems = recentUsers.results?.length
    ? recentUsers.results
        .map((member) => `<li><strong><a href="/admin/users/${escapeHtml(member.id)}">${escapeHtml(member.name || member.email)}</a></strong><br /><span class="muted">${escapeHtml(member.email)} · ${escapeHtml(member.site_role)} · ${escapeHtml(member.status)}${member.organizations ? ` · ${escapeHtml(member.organizations)}` : ""}</span></li>`)
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

      <section class="panel">
        <div class="panel-head">
          <h2>Event scraper</h2>
          <span class="badge">${pendingEvents.length} pending review</span>
        </div>
        <form method="post" action="/admin/scraper/run">
          <button class="primary" type="submit">Run scraper now</button>
        </form>
        <div class="notice">Scraped events are imported as pending drafts. A site admin or the organization admin must approve each event before it appears in the events section.</div>
      </section>

      ${renderPendingEventReview(pendingEvents, "/admin")}

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
            <label>
              Event Page URL
              <input name="event_source_url" type="url" placeholder="https://example.org/events" />
            </label>
            <label>
              Event page format
              <select name="event_parser">
                <option value="">Do not scrape yet</option>
                ${eventParserOptions("")}
              </select>
            </label>
            <label>
              <input name="event_scraping_enabled" type="checkbox" value="1" />
              Import events from this organization
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

async function renderMemberDirectory(env: Env, user: User) {
  const members = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.avatar_object_key, u.profile_title, u.pronouns, u.bio, u.location, u.website_url,
      GROUP_CONCAT(o.name, ', ') AS organizations
     FROM users u
     LEFT JOIN organization_memberships m ON m.user_id = u.id
     LEFT JOIN organizations o ON o.id = m.organization_id
     WHERE u.status = 'active' AND u.profile_visibility = 'members'
     GROUP BY u.id
     ORDER BY COALESCE(u.name, u.email)`
  ).all<{
    id: string;
    email: string;
    name: string | null;
    avatar_object_key: string | null;
    profile_title: string | null;
    pronouns: string | null;
    bio: string | null;
    location: string | null;
    website_url: string | null;
    organizations: string | null;
  }>();

  const memberItems = members.results?.length
    ? members.results
        .map((member) => String.raw`
          <div class="tile member-card">
            ${renderAvatar(member.name || member.email, member.avatar_object_key)}
            <div>
              <strong><a href="/members/${escapeHtml(member.id)}">${escapeHtml(member.name || member.email)}</a></strong>
              <span>${escapeHtml(member.profile_title || member.organizations || "Ecosystem member")}</span>
              <div class="status">
                ${member.pronouns ? `<span>${escapeHtml(member.pronouns)}</span>` : ""}
                ${member.location ? `<span>${escapeHtml(member.location)}</span>` : ""}
              </div>
              ${member.bio ? `<p class="muted">${escapeHtml(excerpt(member.bio, 150))}</p>` : ""}
            </div>
          </div>
        `)
        .join("")
    : `<div class="tile"><strong>No member profiles yet</strong><span>Profiles appear here when members make them visible.</span></div>`;

  return layout("Members", String.raw`
    <section class="dashboard">
      <div class="dashboard-hero panel">
        <div>
          <p class="eyebrow">Member directory</p>
          <h1>People in the ecosystem</h1>
          <p class="lede">Find collaborators, organizers, and organization contacts across the member network.</p>
        </div>
        <div class="stack">
          <a class="button secondary" href="/profile">Edit your profile</a>
        </div>
      </div>

      <section class="dashboard-grid" aria-label="Member profiles">
        ${memberItems}
      </section>
    </section>
  `, user);
}

async function renderMemberProfile(env: Env, user: User, memberId: string) {
  const member = await getMemberProfile(env, memberId);
  if (!member || member.status !== "active" || (member.profile_visibility === "hidden" && user.id !== member.id && user.site_role !== "site_admin")) {
    throw new HttpError(404, "Member not found", "That member profile does not exist or is not visible.");
  }

  const memberships = await getMemberOrganizations(env, member.id);
  const membershipItems = memberships.length
    ? memberships
        .map((membership) => `<li><strong><a href="/organizations/${escapeHtml(membership.slug)}">${escapeHtml(membership.name)}</a></strong><br /><span class="muted">${escapeHtml(formatRole(membership.role))}</span></li>`)
        .join("")
    : `<li><strong>No organizations linked</strong><br /><span class="muted">This member is not linked to an organization yet.</span></li>`;

  return layout(member.name || member.email, String.raw`
    <section class="dashboard content-page">
      <article class="panel">
        <div class="profile-summary">
          ${renderAvatar(member.name || member.email, member.avatar_object_key, true)}
          <div>
            <p class="eyebrow">Member profile</p>
            <h1 class="event-detail-title">${escapeHtml(member.name || member.email)}</h1>
            <p class="lede">${escapeHtml(member.profile_title || "Ecosystem member")}</p>
            <div class="meta">
              ${member.pronouns ? `<span class="badge">${escapeHtml(member.pronouns)}</span>` : ""}
              ${member.location ? `<span class="badge">${escapeHtml(member.location)}</span>` : ""}
              ${member.site_role === "site_admin" ? `<span class="badge">Site admin</span>` : ""}
            </div>
          </div>
        </div>
        ${member.bio ? `<p class="post-body lede">${escapeHtml(member.bio)}</p>` : `<p class="lede">This member has not added a bio yet.</p>`}
        <div class="actions">
          <a class="button secondary" href="/members">All members</a>
          ${member.website_url ? `<a class="button secondary" href="${escapeHtml(member.website_url)}">Website</a>` : ""}
          ${member.id === user.id ? `<a class="button primary" href="/profile">Edit profile</a>` : ""}
          ${user.site_role === "site_admin" ? `<a class="button secondary" href="/admin/users/${escapeHtml(member.id)}">Admin edit</a>` : ""}
        </div>
      </article>

      <aside class="panel">
        <div class="panel-head">
          <h2>Organizations</h2>
          <span class="badge">${memberships.length} linked</span>
        </div>
        <ul class="compact-list">${membershipItems}</ul>
      </aside>
    </section>
  `, user);
}

async function renderEditOwnProfile(env: Env, user: User) {
  const member = await getMemberProfile(env, user.id);
  if (!member) {
    throw new HttpError(404, "Member not found", "That member profile does not exist.");
  }

  return layout("Edit profile", String.raw`
    <section class="dashboard content-page">
      <div class="dashboard-hero panel">
        <div>
          <p class="eyebrow">Your profile</p>
          <h1>Edit profile</h1>
          <p class="lede">Choose what other members can see when they open your profile or browse the member directory.</p>
        </div>
        <div class="stack">
          <a class="button secondary" href="/members/${escapeHtml(member.id)}">View profile</a>
          <a class="button secondary" href="/members">Member directory</a>
        </div>
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2>Profile details</h2>
          <span class="badge">${member.profile_visibility === "members" ? "Visible to members" : "Hidden"}</span>
        </div>
        ${renderMemberProfileForm(member, "/profile", false)}
      </section>
    </section>
  `, user);
}

async function handleUpdateOwnProfile(request: Request, env: Env, user: User) {
  const form = await request.formData();
  const profile = readMemberProfileForm(form);
  const existing = await getMemberProfile(env, user.id);
  if (!existing) {
    throw new HttpError(404, "Member not found", "That member profile does not exist.");
  }
  const avatarObjectKey = await uploadProfilePhoto(env, user.id, form.get("avatar"), existing.avatar_object_key);

  await env.DB.prepare(
    `UPDATE users
     SET name = ?, avatar_object_key = ?, profile_title = ?, pronouns = ?, bio = ?, location = ?, website_url = ?, profile_visibility = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(
      profile.name || null,
      avatarObjectKey || null,
      profile.profileTitle || null,
      profile.pronouns || null,
      profile.bio || null,
      profile.location || null,
      profile.websiteUrl || null,
      profile.profileVisibility,
      new Date().toISOString(),
      user.id
    )
    .run();

  await writeAudit(env, user.id, "member.profile_self_updated", "user", user.id, {
    profile_visibility: profile.profileVisibility,
  });

  return redirect("/profile");
}

async function getMemberProfile(env: Env, memberId: string) {
  return env.DB.prepare(
    `SELECT id, email, name, avatar_object_key, profile_title, pronouns, bio, location, website_url,
      profile_visibility, site_role, status, created_at, updated_at, last_seen_at
     FROM users
     WHERE id = ?`
  )
    .bind(memberId)
    .first<MemberProfile>();
}

async function getMemberOrganizations(env: Env, memberId: string) {
  const memberships = await env.DB.prepare(
    `SELECT o.name, o.slug, m.role
     FROM organization_memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = ?
     ORDER BY o.name`
  )
    .bind(memberId)
    .all<{ name: string; slug: string; role: string }>();
  return memberships.results ?? [];
}

function renderMemberProfileForm(member: MemberProfile, action: string, includeAdminFields: boolean) {
  return String.raw`
    <form method="post" action="${escapeHtml(action)}" enctype="multipart/form-data">
      <div class="profile-summary">
        ${renderAvatar(member.name || member.email, member.avatar_object_key, true)}
        <label>
          Profile photo
          <input name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </label>
      </div>
      <label>
        Name
        <input name="name" type="text" autocomplete="name" value="${escapeHtml(member.name || "")}" />
      </label>
      ${includeAdminFields ? String.raw`
        <label>
          Email
          <input name="email" type="email" value="${escapeHtml(member.email)}" required />
        </label>
      ` : ""}
      <label>
        Role or title
        <input name="profile_title" type="text" value="${escapeHtml(member.profile_title || "")}" placeholder="Organizer, policy lead, volunteer coordinator..." />
      </label>
      <label>
        Pronouns
        <input name="pronouns" type="text" value="${escapeHtml(member.pronouns || "")}" />
      </label>
      <label>
        Location
        <input name="location" type="text" value="${escapeHtml(member.location || "")}" placeholder="Manchester, Seacoast, Upper Valley..." />
      </label>
      <label>
        Website
        <input name="website_url" type="url" value="${escapeHtml(member.website_url || "")}" />
      </label>
      <label>
        Bio
        <textarea name="bio" placeholder="Share what you work on, what you can help with, and what you want members to know.">${escapeHtml(member.bio || "")}</textarea>
      </label>
      <label>
        Profile visibility
        <select name="profile_visibility">
          <option value="members" ${member.profile_visibility === "members" ? "selected" : ""}>Visible to members</option>
          <option value="hidden" ${member.profile_visibility === "hidden" ? "selected" : ""}>Hidden from member directory</option>
        </select>
      </label>
      ${includeAdminFields ? String.raw`
        <label>
          Site role
          <select name="site_role">
            <option value="member" ${member.site_role === "member" ? "selected" : ""}>Member</option>
            <option value="site_admin" ${member.site_role === "site_admin" ? "selected" : ""}>Site admin</option>
          </select>
        </label>
        <label>
          Account status
          <select name="status">
            <option value="invited" ${member.status === "invited" ? "selected" : ""}>Invited</option>
            <option value="active" ${member.status === "active" ? "selected" : ""}>Active</option>
            <option value="suspended" ${member.status === "suspended" ? "selected" : ""}>Suspended</option>
          </select>
        </label>
      ` : ""}
      <button class="primary" type="submit">Save profile</button>
    </form>
  `;
}

function readMemberProfileForm(form: FormData) {
  const websiteUrl = normalizeOptionalUrl(form.get("website_url"));
  const rawWebsite = typeof form.get("website_url") === "string" ? String(form.get("website_url")).trim() : "";
  if (rawWebsite && !websiteUrl) {
    throw new HttpError(400, "Website URL invalid", "Use a full website URL starting with http:// or https://.");
  }

  return {
    name: cleanText(form.get("name"), 120),
    profileTitle: cleanText(form.get("profile_title"), 160),
    pronouns: cleanText(form.get("pronouns"), 80),
    bio: cleanText(form.get("bio"), 1200),
    location: cleanText(form.get("location"), 120),
    websiteUrl,
    profileVisibility: cleanProfileVisibility(form.get("profile_visibility")),
  };
}

function renderAvatar(label: string, avatarObjectKey: string | null | undefined = null, large = false) {
  if (avatarObjectKey) {
    return `<img class="avatar${large ? " large" : ""}" src="${escapeHtml(mediaUrl(avatarObjectKey))}" alt="" loading="lazy" />`;
  }
  const initials = label
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "NH";
  return `<span class="avatar${large ? " large" : ""}" aria-hidden="true">${escapeHtml(initials)}</span>`;
}

async function renderAdminUserProfile(env: Env, admin: User, userId: string) {
  const member = await env.DB.prepare(
    `SELECT id, email, name, avatar_object_key, profile_title, pronouns, bio, location, website_url,
      profile_visibility, site_role, status, created_at, updated_at, last_seen_at
     FROM users
     WHERE id = ?`
  )
    .bind(userId)
    .first<MemberProfile>();

  if (!member) {
    throw new HttpError(404, "Member not found", "That member profile does not exist.");
  }

  const memberships = await env.DB.prepare(
    `SELECT o.name, o.slug, m.role
     FROM organization_memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = ?
     ORDER BY o.name`
  )
    .bind(member.id)
    .all<{ name: string; slug: string; role: string }>();
  const membershipItems = memberships.results?.length
    ? memberships.results
        .map((membership) => `<li><strong><a href="/organizations/${escapeHtml(membership.slug)}">${escapeHtml(membership.name)}</a></strong><br /><span class="muted">${escapeHtml(formatRole(membership.role))}</span></li>`)
        .join("")
    : `<li><strong>No organizations linked</strong><br /><span class="muted">Invite this member to an organization from the admin tools page.</span></li>`;

  return layout("Edit member", String.raw`
    <section class="dashboard">
      <div class="dashboard-hero panel">
        <div>
          <p class="eyebrow">Member profile</p>
          <h1>${escapeHtml(member.name || member.email)}</h1>
          <p class="lede">Update account details, site access, and profile information for this member.</p>
          <div class="status">
            <span>${escapeHtml(member.email)}</span>
            <span>${escapeHtml(member.site_role)}</span>
            <span>${escapeHtml(member.status)}</span>
          </div>
        </div>
        <div class="stack">
          <a class="button secondary" href="/admin">Admin tools</a>
        </div>
      </div>

      <section class="admin-columns">
        <aside class="panel">
          <div class="panel-head">
            <h2>Profile details</h2>
            <span class="badge">${member.id === admin.id ? "Your account" : "Editable"}</span>
          </div>
          ${renderMemberProfileForm(member, `/admin/users/${member.id}`, true)}
        </aside>

        <aside class="panel">
          <div class="panel-head">
            <h2>Organizations</h2>
            <span class="badge">${memberships.results?.length ?? 0} linked</span>
          </div>
          <ul class="compact-list">${membershipItems}</ul>
          <div class="notice">
            Organization roles are currently updated by sending an admin invite for the same member and organization.
          </div>
          <div class="status">
            <span>Created ${escapeHtml(formatDate(member.created_at))}</span>
            <span>Updated ${escapeHtml(formatDate(member.updated_at))}</span>
            ${member.last_seen_at ? `<span>Last seen ${escapeHtml(formatDate(member.last_seen_at))}</span>` : ""}
          </div>
        </aside>
      </section>
    </section>
  `, admin);
}

async function handleUpdateUserProfile(request: Request, env: Env, admin: User, userId: string) {
  const existing = await env.DB.prepare("SELECT id, email, avatar_object_key, site_role, status FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: string; email: string; avatar_object_key: string | null; site_role: "member" | "site_admin"; status: "invited" | "active" | "suspended" }>();
  if (!existing) {
    throw new HttpError(404, "Member not found", "That member profile does not exist.");
  }

  const form = await request.formData();
  const name = cleanText(form.get("name"), 120);
  const email = normalizeEmail(form.get("email"));
  const siteRole = cleanSiteRole(form.get("site_role"));
  const status = cleanUserStatus(form.get("status"));
  const profile = readMemberProfileForm(form);

  if (!email || !siteRole || !status) {
    throw new HttpError(400, "Profile details required", "Enter a valid email, site role, and account status.");
  }

  if (existing.id === admin.id && (siteRole !== "site_admin" || status !== "active")) {
    throw new HttpError(400, "Cannot lock yourself out", "Keep your own account active and assigned as a site admin.");
  }

  const avatarObjectKey = await uploadProfilePhoto(env, existing.id, form.get("avatar"), existing.avatar_object_key);

  try {
    await env.DB.prepare(
      `UPDATE users
       SET email = ?, name = ?, avatar_object_key = ?, profile_title = ?, pronouns = ?, bio = ?, location = ?, website_url = ?,
         profile_visibility = ?, site_role = ?, status = ?, updated_at = ?
       WHERE id = ?`
    )
      .bind(
        email,
        name || null,
        avatarObjectKey || null,
        profile.profileTitle || null,
        profile.pronouns || null,
        profile.bio || null,
        profile.location || null,
        profile.websiteUrl || null,
        profile.profileVisibility,
        siteRole,
        status,
        new Date().toISOString(),
        existing.id
      )
      .run();
  } catch {
    throw new HttpError(400, "Email already in use", "Choose a different email address for this member.");
  }

  await writeAudit(env, admin.id, "member.profile_updated", "user", existing.id, {
    previous_email: existing.email,
    email,
    site_role: siteRole,
    status,
    profile_visibility: profile.profileVisibility,
  });

  return redirect(`/admin/users/${existing.id}`);
}

async function renderOrganizationProfile(env: Env, user: User, slug: string) {
  if (!slug) {
    throw new HttpError(404, "Organization not found", "That organization profile does not exist.");
  }

  const organization = await env.DB.prepare(
    `SELECT id, name, slug, summary, description, website_url, contact_email, status,
      logo_object_key, event_source_url, event_parser, event_scraping_enabled
     FROM organizations
     WHERE slug = ? AND status != 'archived'`
  )
    .bind(slug)
    .first<{
      id: string;
      name: string;
      slug: string;
      summary: string | null;
      description: string | null;
      website_url: string | null;
      contact_email: string | null;
      logo_object_key: string | null;
      status: string;
      event_source_url: string | null;
      event_parser: string | null;
      event_scraping_enabled: number;
    }>();

  if (!organization) {
    throw new HttpError(404, "Organization not found", "That organization profile does not exist.");
  }

  const membership = await env.DB.prepare(
    `SELECT role FROM organization_memberships
     WHERE organization_id = ? AND user_id = ?`
  )
    .bind(organization.id, user.id)
    .first<{ role: string }>();

  if (!membership && user.site_role !== "site_admin") {
    throw new HttpError(403, "Members only", "You need to belong to this organization to view its profile.");
  }

  const canEdit = user.site_role === "site_admin" || membership?.role === "org_admin";
  const members = await env.DB.prepare(
    `SELECT u.name, u.email, m.role
     FROM organization_memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = ?
     ORDER BY m.role DESC, u.name, u.email`
  )
    .bind(organization.id)
    .all<{ name: string | null; email: string; role: string }>();
  const memberItems = members.results?.length
    ? members.results
        .map((member) => `<li><strong>${escapeHtml(member.name || member.email)}</strong><br /><span class="muted">${escapeHtml(member.email)} · ${escapeHtml(formatRole(member.role))}</span></li>`)
        .join("")
    : `<li><strong>No linked members</strong><br /><span class="muted">Invite members from the admin tools.</span></li>`;
  const pendingEvents = canEdit ? await getPendingEvents(env, user, organization.id) : [];

  return layout(organization.name, String.raw`
    <section class="dashboard">
      <div class="dashboard-hero panel">
        <div>
          <p class="eyebrow">${escapeHtml(formatRole(membership?.role || user.site_role))}</p>
          ${organization.logo_object_key ? `<img class="org-logo large" src="${escapeHtml(mediaUrl(organization.logo_object_key))}" alt="" loading="lazy" />` : ""}
          <h1>${escapeHtml(organization.name)}</h1>
          <p class="lede">${escapeHtml(organization.summary || "This organization profile is ready for details.")}</p>
          <div class="status">
            <span>${escapeHtml(organization.status)}</span>
            ${organization.contact_email ? `<span>${escapeHtml(organization.contact_email)}</span>` : ""}
            ${organization.website_url ? `<span>${escapeHtml(organization.website_url)}</span>` : ""}
          </div>
        </div>
        ${user.site_role === "site_admin" ? `<div class="stack"><a class="button secondary" href="/admin">Admin tools</a></div>` : ""}
      </div>

      <section class="admin-columns">
        <article class="panel">
          <div class="panel-head">
            <h2>Profile</h2>
            <span class="badge">${canEdit ? "Editable" : "Read only"}</span>
          </div>
          <p class="muted">${escapeHtml(organization.description || organization.summary || "No long description yet.")}</p>
          ${organization.website_url ? `<div class="actions"><a class="button secondary" href="${escapeHtml(organization.website_url)}">Visit website</a></div>` : ""}
        </article>

        <aside class="panel">
          <div class="panel-head">
            <h2>Members</h2>
            <span class="badge">${members.results?.length ?? 0} linked</span>
          </div>
          <ul class="compact-list">${memberItems}</ul>
        </aside>
      </section>

      ${canEdit ? renderPendingEventReview(pendingEvents, `/organizations/${organization.slug}`) : ""}

      ${canEdit ? renderOrganizationEditForm(organization) : ""}
    </section>
  `, user);
}

function renderOrganizationEditForm(organization: {
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  website_url: string | null;
  contact_email: string | null;
  logo_object_key: string | null;
  event_source_url: string | null;
  event_parser: string | null;
  event_scraping_enabled: number;
}) {
  return String.raw`
    <section class="panel">
      <div class="panel-head">
        <h2>Edit organization profile</h2>
        <span class="badge">Org admin</span>
      </div>
      <form method="post" action="/organizations/${escapeHtml(organization.slug)}" enctype="multipart/form-data">
        <label>
          Organization name
          <input name="name" type="text" value="${escapeHtml(organization.name)}" required />
        </label>
        <label>
          Contact email
          <input name="contact_email" type="email" value="${escapeHtml(organization.contact_email || "")}" />
        </label>
        <label>
          Website URL
          <input name="website_url" type="url" value="${escapeHtml(organization.website_url || "")}" />
        </label>
        <label>
          Organization logo
          <input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </label>
        <label>
          Event Page URL
          <input name="event_source_url" type="url" value="${escapeHtml(organization.event_source_url || "")}" placeholder="https://example.org/events" />
        </label>
        <label>
          Event page format
          <select name="event_parser">
            <option value="">Do not scrape</option>
            ${eventParserOptions(organization.event_parser || "")}
          </select>
        </label>
        <label>
          <input name="event_scraping_enabled" type="checkbox" value="1" ${organization.event_scraping_enabled ? "checked" : ""} />
          Import events from this organization
        </label>
        <label>
          Summary
          <textarea name="summary">${escapeHtml(organization.summary || "")}</textarea>
        </label>
        <label>
          Description
          <textarea name="description">${escapeHtml(organization.description || "")}</textarea>
        </label>
        <button class="primary" type="submit">Save profile</button>
      </form>
    </section>
  `;
}

async function handleUpdateOrganization(request: Request, env: Env, user: User, slug: string) {
  const organization = await env.DB.prepare("SELECT id, slug, logo_object_key FROM organizations WHERE slug = ?")
    .bind(slug)
    .first<{ id: string; slug: string; logo_object_key: string | null }>();

  if (!organization) {
    throw new HttpError(404, "Organization not found", "That organization profile does not exist.");
  }

  const membership = await env.DB.prepare(
    `SELECT role FROM organization_memberships
     WHERE organization_id = ? AND user_id = ?`
  )
    .bind(organization.id, user.id)
    .first<{ role: string }>();

  if (user.site_role !== "site_admin" && membership?.role !== "org_admin") {
    throw new HttpError(403, "Org admin only", "You need organization admin access to edit this profile.");
  }

  const form = await request.formData();
  const name = cleanText(form.get("name"), 180);
  const contactEmail = normalizeOptionalEmail(form.get("contact_email"));
  const websiteUrl = normalizeOptionalUrl(form.get("website_url"));
  const summary = cleanText(form.get("summary"), 500);
  const description = cleanText(form.get("description"), 2400);
  const eventSourceUrl = normalizeOptionalUrl(form.get("event_source_url"));
  const eventParser = cleanEventParser(form.get("event_parser"));
  const eventScrapingEnabled = form.get("event_scraping_enabled") === "1" && Boolean(eventSourceUrl && eventParser);
  const logoObjectKey = await uploadOrganizationLogo(env, organization.id, form.get("logo"), organization.logo_object_key);

  if (!name) {
    throw new HttpError(400, "Organization name required", "The organization name cannot be blank.");
  }

  await env.DB.prepare(
    `UPDATE organizations
     SET name = ?, contact_email = ?, website_url = ?, summary = ?, description = ?,
       logo_object_key = ?, event_source_url = ?, event_parser = ?, event_scraping_enabled = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(name, contactEmail || null, websiteUrl || null, summary || null, description || null,
      logoObjectKey || null, eventSourceUrl || null, eventParser || null, eventScrapingEnabled ? 1 : 0, new Date().toISOString(), organization.id)
    .run();

  await writeAudit(env, user.id, "organization.updated", "organization", organization.id, { slug: organization.slug });
  return redirect(`/organizations/${organization.slug}`);
}

async function handleCreateOrganization(request: Request, env: Env, user: User) {
  const form = await request.formData();
  const name = cleanText(form.get("name"), 180);
  const slugInput = cleanText(form.get("slug"), 120);
  const contactEmail = normalizeOptionalEmail(form.get("contact_email"));
  const summary = cleanText(form.get("summary"), 500);
  const eventSourceUrl = normalizeOptionalUrl(form.get("event_source_url"));
  const eventParser = cleanEventParser(form.get("event_parser"));
  const eventScrapingEnabled = form.get("event_scraping_enabled") === "1" && Boolean(eventSourceUrl && eventParser);
  const slug = slugify(slugInput || name);

  if (!name || !slug) {
    throw new HttpError(400, "Organization details required", "Organization name is required.");
  }

  const organizationId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO organizations (id, name, slug, summary, contact_email, event_source_url, event_parser, event_scraping_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(organizationId, name, slug, summary || null, contactEmail || null, eventSourceUrl || null, eventParser || null, eventScrapingEnabled ? 1 : 0)
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

async function handleRunScraper(env: Env, user: User) {
  if (!env.SCRAPER_RUN_URL || !env.SCRAPER_ADMIN_TOKEN) {
    throw new HttpError(503, "Scraper trigger unavailable", "SCRAPER_RUN_URL and SCRAPER_ADMIN_TOKEN must be configured before admins can run the scraper.");
  }

  const response = await fetch(env.SCRAPER_RUN_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SCRAPER_ADMIN_TOKEN}`,
      Accept: "application/json",
    },
  });
  const resultText = await response.text();
  if (!response.ok) {
    throw new HttpError(502, "Scraper run failed", resultText || `The scraper returned ${response.status}.`);
  }

  await writeAudit(env, user.id, "event_scraper.manual_run", "system", "event-scraper", {
    result: resultText.slice(0, 1000),
  });

  return html(layout("Scraper run complete", String.raw`
    <section class="auth-shell">
      <div class="auth-card">
        <p class="eyebrow">Event scraper</p>
        <h1>Run complete</h1>
        <p class="lede">${escapeHtml(resultText)}</p>
        <div class="actions"><a class="button secondary" href="/admin">Back to admin</a></div>
      </div>
    </section>
  `, user));
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

async function handleMediaObject(request: Request, env: Env) {
  const key = decodeURIComponent(new URL(request.url).pathname.replace("/media/", ""));
  if (!key.startsWith("org-logos/") && !key.startsWith("profile-photos/")) {
    return notFound();
  }

  const object = await env.ASSETS.get(key);
  if (!object) {
    return notFound();
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=3600");
  return new Response(object.body, { headers });
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

async function getWritableOrganizations(env: Env, user: User) {
  if (user.site_role === "site_admin") {
    const organizations = await env.DB.prepare(
      "SELECT id, name FROM organizations WHERE status = 'active' ORDER BY name"
    ).all<{ id: string; name: string }>();
    return organizations.results ?? [];
  }

  const organizations = await env.DB.prepare(
    `SELECT o.id, o.name
     FROM organization_memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = ?
       AND m.role IN ('contributor', 'org_admin')
       AND o.status = 'active'
     ORDER BY o.name`
  )
    .bind(user.id)
    .all<{ id: string; name: string }>();
  return organizations.results ?? [];
}

async function requireCanPostForOrganization(env: Env, user: User, organizationId: string) {
  if (user.site_role === "site_admin") {
    const organization = await env.DB.prepare("SELECT id FROM organizations WHERE id = ? AND status = 'active'")
      .bind(organizationId)
      .first<{ id: string }>();
    if (organization) {
      return;
    }
  } else {
    const membership = await env.DB.prepare(
      `SELECT role FROM organization_memberships
       WHERE organization_id = ? AND user_id = ? AND role IN ('contributor', 'org_admin')`
    )
      .bind(organizationId, user.id)
      .first<{ role: string }>();
    if (membership) {
      return;
    }
  }

  throw new HttpError(403, "Contributor access required", "You need contributor or organization admin access to post for that organization.");
}

async function canManageEvent(env: Env, user: User, organizationId: string | null) {
  if (user.site_role === "site_admin") {
    return true;
  }
  if (!organizationId) {
    return false;
  }
  const membership = await env.DB.prepare(
    "SELECT role FROM organization_memberships WHERE organization_id = ? AND user_id = ? AND role = 'org_admin'"
  )
    .bind(organizationId, user.id)
    .first<{ role: string }>();
  return Boolean(membership);
}

async function requireCanManageEvent(env: Env, user: User, organizationId: string | null) {
  if (await canManageEvent(env, user, organizationId)) {
    return;
  }
  throw new HttpError(403, "Event editor access required", "Only site admins and organization admins can edit this event.");
}

async function uploadOrganizationLogo(env: Env, organizationId: string, value: FormDataEntryValue | null, currentKey: string | null) {
  if (!isUploadedFile(value)) {
    return currentKey;
  }

  const allowedTypes: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension = allowedTypes[value.type];
  if (!extension) {
    throw new HttpError(400, "Unsupported logo file", "Upload a PNG, JPG, WebP, or GIF image.");
  }
  if (value.size > 2 * 1024 * 1024) {
    throw new HttpError(400, "Logo too large", "Upload a logo smaller than 2 MB.");
  }

  const key = `org-logos/${organizationId}-${crypto.randomUUID()}.${extension}`;
  await env.ASSETS.put(key, await value.arrayBuffer(), {
    httpMetadata: { contentType: value.type },
  });
  return key;
}

async function uploadProfilePhoto(env: Env, userId: string, value: FormDataEntryValue | null, currentKey: string | null) {
  if (!isUploadedFile(value)) {
    return currentKey;
  }

  const allowedTypes: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension = allowedTypes[value.type];
  if (!extension) {
    throw new HttpError(400, "Unsupported profile photo", "Upload a PNG, JPG, WebP, or GIF image.");
  }
  if (value.size > 2 * 1024 * 1024) {
    throw new HttpError(400, "Profile photo too large", "Upload a profile photo smaller than 2 MB.");
  }

  const key = `profile-photos/${userId}-${crypto.randomUUID()}.${extension}`;
  await env.ASSETS.put(key, await value.arrayBuffer(), {
    httpMetadata: { contentType: value.type },
  });
  return key;
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object"
    && value !== null
    && "arrayBuffer" in value
    && "size" in value
    && "type" in value
    && typeof value.arrayBuffer === "function"
    && typeof value.size === "number"
    && value.size > 0
    && typeof value.type === "string";
}

async function requireCanReadPost(env: Env, user: User, organizationId: string | null, visibility: string) {
  if (visibility !== "organization" || user.site_role === "site_admin" || !organizationId) {
    return;
  }

  const membership = await env.DB.prepare(
    "SELECT role FROM organization_memberships WHERE organization_id = ? AND user_id = ?"
  )
    .bind(organizationId, user.id)
    .first<{ role: string }>();

  if (!membership) {
    throw new HttpError(403, "Organization-only post", "You need to belong to this organization to view this post.");
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
        ${user ? `<a href="/legislation">Legislation</a>` : ""}
        ${user ? `<a href="/events">Events</a>` : ""}
        ${user ? `<a href="/projects">Projects</a>` : ""}
        ${user ? `<a href="/updates">Updates</a>` : ""}
        ${user ? `<a href="/members">Members</a>` : ""}
        ${user?.site_role === "site_admin" ? `<a href="/admin">Admin</a>` : ""}
        ${!user ? `<a href="/request-invite">Request invite</a>` : `<a href="/profile">${escapeHtml(user.name || user.email)}</a>`}
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
      "content-security-policy": "default-src 'self'; img-src 'self' https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
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

function normalizeOptionalUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function cleanSection(value: FormDataEntryValue | null) {
  if (value === "legislation" || value === "event" || value === "project" || value === "update") {
    return value;
  }
  return "";
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

function cleanSiteRole(value: FormDataEntryValue | null) {
  return value === "member" || value === "site_admin" ? value : "";
}

function cleanUserStatus(value: FormDataEntryValue | null) {
  return value === "invited" || value === "active" || value === "suspended" ? value : "";
}

function cleanProfileVisibility(value: FormDataEntryValue | null) {
  return value === "members" || value === "hidden" ? value : "members";
}

function cleanDateTimeLocal(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return "";
  }
  return `${trimmed}:00`;
}

function cleanOptionalDateTimeLocal(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }
  return cleanDateTimeLocal(value);
}

function cleanEventParser(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) {
    return "";
  }
  return eventParsers().includes(value) ? value : "";
}

function eventParsers() {
  return [
    "squarespace_events",
    "heading_date_events",
    "generic_links",
    "squarespace_blog",
    "shopify_blog_events",
    "wordpress_posts",
  ];
}

function eventParserOptions(selected: string) {
  return eventParsers()
    .map((parser) => `<option value="${parser}" ${selected === parser ? "selected" : ""}>${parser}</option>`)
    .join("");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatRole(role: string) {
  const labels: Record<string, string> = {
    org_admin: "Organization admin",
    contributor: "Contributor",
    viewer: "Viewer",
    site_admin: "Site admin",
    member: "Member",
  };
  return labels[role] ?? role;
}

function mediaUrl(objectKey: string) {
  const path = `/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
  return path
    .replace("/org-logos/", "/media/org-logos/")
    .replace("/profile-photos/", "/media/profile-photos/");
}

function renderOrganizationPill(name: string, logoObjectKey: string | null | undefined) {
  return String.raw`
    <span class="badge org-pill">
      ${logoObjectKey ? `<img class="org-logo" src="${escapeHtml(mediaUrl(logoObjectKey))}" alt="" loading="lazy" />` : ""}
      <span>${escapeHtml(name)}</span>
    </span>
  `;
}

type PendingEvent = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  organization_id: string | null;
  organization_name: string | null;
  organization_slug: string | null;
  organization_logo_object_key: string | null;
  starts_at: string | null;
  location_name: string | null;
  external_url: string | null;
  source_url: string | null;
  image_url: string | null;
  scraped_at: string | null;
};

async function getPendingEvents(env: Env, user: User, organizationId?: string) {
  const selectSql = `SELECT p.id, p.title, p.body, p.created_at, p.organization_id,
      o.name AS organization_name, o.slug AS organization_slug, o.logo_object_key AS organization_logo_object_key,
      e.starts_at, e.location_name, e.external_url, e.source_url, e.image_url, e.scraped_at
     FROM posts p
     JOIN events e ON e.post_id = p.id
     LEFT JOIN organizations o ON o.id = p.organization_id
     WHERE p.section = 'event' AND p.status = 'draft'`;
  const orderSql = " ORDER BY COALESCE(e.scraped_at, p.created_at) DESC LIMIT 25";

  if (user.site_role === "site_admin") {
    const query = organizationId ? `${selectSql} AND p.organization_id = ?${orderSql}` : `${selectSql}${orderSql}`;
    const statement = env.DB.prepare(query);
    const pending = organizationId ? await statement.bind(organizationId).all<PendingEvent>() : await statement.all<PendingEvent>();
    return pending.results ?? [];
  }

  const accessSql = ` AND EXISTS (
      SELECT 1 FROM organization_memberships m
      WHERE m.organization_id = p.organization_id
        AND m.user_id = ?
        AND m.role = 'org_admin'
    )`;
  const query = organizationId ? `${selectSql}${accessSql} AND p.organization_id = ?${orderSql}` : `${selectSql}${accessSql}${orderSql}`;
  const statement = env.DB.prepare(query);
  const pending = organizationId
    ? await statement.bind(user.id, organizationId).all<PendingEvent>()
    : await statement.bind(user.id).all<PendingEvent>();
  return pending.results ?? [];
}

function renderPendingEventReview(events: PendingEvent[], returnTo: string) {
  const safeReturnTo = sanitizeReviewReturnPath(returnTo);
  const items = events.length
    ? events
        .map((event) => {
          const sourceUrl = event.external_url || event.source_url;
          return String.raw`
            <li class="${event.image_url ? "with-image" : ""}">
              ${event.image_url ? `<img class="list-thumb" src="${escapeHtml(event.image_url)}" alt="" loading="lazy" />` : ""}
              <div class="list-copy">
                <strong>${escapeHtml(event.title)}</strong>
                <p>${escapeHtml(excerpt(event.body, 260))}</p>
                <div class="meta">
                  ${event.organization_name ? renderOrganizationPill(event.organization_name, event.organization_logo_object_key) : `<span class="badge">Ecosystem-wide</span>`}
                  <span class="badge">${escapeHtml(formatDate(event.starts_at || event.created_at))}</span>
                  ${event.location_name ? `<span class="badge">${escapeHtml(event.location_name)}</span>` : ""}
                  ${event.scraped_at ? `<span class="badge">Scraped ${escapeHtml(formatDate(event.scraped_at))}</span>` : ""}
                </div>
                <div class="review-actions">
                  <form method="post" action="/posts/${escapeHtml(event.id)}/approve">
                    <input type="hidden" name="return_to" value="${escapeHtml(safeReturnTo)}" />
                    <button class="primary" type="submit">Approve</button>
                  </form>
                  <form method="post" action="/posts/${escapeHtml(event.id)}/reject">
                    <input type="hidden" name="return_to" value="${escapeHtml(safeReturnTo)}" />
                    <button class="danger" type="submit">Reject</button>
                  </form>
                  ${sourceUrl ? `<a class="button secondary" href="${escapeHtml(sourceUrl)}">Source</a>` : ""}
                </div>
              </div>
            </li>
          `;
        })
        .join("")
    : `<li><strong>No pending events</strong><br /><span class="muted">New scraped events will appear here for review before publishing.</span></li>`;

  return String.raw`
    <section class="panel">
      <div class="panel-head">
        <h2>Pending event review</h2>
        <span class="badge">${events.length} pending</span>
      </div>
      <ul class="compact-list">${items}</ul>
    </section>
  `;
}

async function getModeratableEvent(env: Env, postId: string, expectedStatus: string) {
  const post = await env.DB.prepare(
    `SELECT p.id, p.organization_id, p.status, o.slug AS organization_slug
     FROM posts p
     LEFT JOIN organizations o ON o.id = p.organization_id
     WHERE p.id = ? AND p.section = 'event' AND p.status = ?`
  )
    .bind(postId, expectedStatus)
    .first<{ id: string; organization_id: string | null; status: string; organization_slug: string | null }>();
  if (!post) {
    throw new HttpError(404, "Event not found", "That event is not waiting for review.");
  }
  return post;
}

async function reviewReturnPath(request: Request) {
  const form = await request.formData();
  const value = form.get("return_to");
  return sanitizeReviewReturnPath(typeof value === "string" ? value : "");
}

function sanitizeReviewReturnPath(value: string) {
  if (value === "/admin" || value.startsWith("/organizations/")) {
    return value;
  }
  return "/admin";
}

type ScrapedEvent = {
  partner?: unknown;
  title?: unknown;
  start_date?: unknown;
  end_date?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  location?: unknown;
  description?: unknown;
  url?: unknown;
  source_url?: unknown;
  image_url?: unknown;
  kind?: unknown;
  scraped_at?: unknown;
};

function requireScraperToken(request: Request, env: Env) {
  if (!env.SCRAPER_API_TOKEN) {
    throw new HttpError(503, "Scraper integration unavailable", "SCRAPER_API_TOKEN is not configured.");
  }
  if (request.headers.get("authorization") !== `Bearer ${env.SCRAPER_API_TOKEN}`) {
    throw new HttpError(401, "Unauthorized", "A valid scraper bearer token is required.");
  }
}

async function handleScraperOrganizations(request: Request, env: Env) {
  requireScraperToken(request, env);
  const organizations = await env.DB.prepare(
    `SELECT id AS organization_id, name, event_source_url AS url, event_parser AS parser, 'event' AS kind
     FROM organizations
     WHERE status = 'active' AND event_scraping_enabled = 1
       AND event_source_url IS NOT NULL AND event_parser IS NOT NULL
     ORDER BY name`
  ).all();
  return Response.json({ partners: organizations.results ?? [] });
}

async function handleScraperEvents(request: Request, env: Env) {
  requireScraperToken(request, env);
  let payload: { records?: ScrapedEvent[] } | ScrapedEvent[];
  try {
    payload = await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON", "Send a JSON array or an object with a records array.");
  }
  const records = Array.isArray(payload) ? payload : payload.records;
  if (!Array.isArray(records) || records.length > 500) {
    throw new HttpError(400, "Invalid records", "Send no more than 500 event records at a time.");
  }

  const organizations = await env.DB.prepare(
    "SELECT id, name FROM organizations WHERE status = 'active' AND event_scraping_enabled = 1"
  ).all<{ id: string; name: string }>();
  const organizationByName = new Map((organizations.results ?? []).map((org) => [org.name.toLowerCase(), org]));
  let imported = 0;
  let skipped = 0;

  for (const raw of records) {
    const partner = typeof raw.partner === "string" ? raw.partner.trim() : "";
    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 220) : "";
    const startDate = typeof raw.start_date === "string" ? raw.start_date.trim() : "";
    const organization = organizationByName.get(partner.toLowerCase());
    if (!organization || !title || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || (raw.kind && raw.kind !== "event")) {
      skipped++;
      continue;
    }

    const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
    const sourceUrl = text(raw.source_url, 2000);
    const externalUrl = text(raw.url, 2000);
    const imageUrl = normalizeScrapedUrl(text(raw.image_url, 2000));
    const startTime = text(raw.start_time, 12);
    const endDate = text(raw.end_date, 10);
    const endTime = text(raw.end_time, 12);
    const startsAt = `${startDate}T${normalizeScrapedTime(startTime) || "00:00"}:00`;
    const endsAt = endDate ? `${endDate}T${normalizeScrapedTime(endTime) || "23:59"}:00` : null;
    const description = text(raw.description, 5500);
    const location = text(raw.location, 500);
    const scrapedAt = text(raw.scraped_at, 40) || new Date().toISOString();
    const identity = `${organization.id}|${externalUrl || sourceUrl}|${title.toLowerCase()}|${startDate}`;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
    const externalId = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const postId = `scraped:${externalId}`;
    const body = description || `Event published by ${organization.name}.`;

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO posts (id, organization_id, author_user_id, section, title, body, visibility, status)
         VALUES (?, ?, 'system:event-scraper', 'event', ?, ?, 'members', 'draft')
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           body = excluded.body,
           status = CASE
             WHEN posts.status = 'published' THEN 'published'
             WHEN posts.status = 'archived' THEN 'archived'
             ELSE 'draft'
           END,
           updated_at = CURRENT_TIMESTAMP`
      ).bind(postId, organization.id, title, body),
      env.DB.prepare(
        `INSERT INTO events (post_id, starts_at, ends_at, location_name, registration_url, source_url, external_url, external_id, scraped_at, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(post_id) DO UPDATE SET starts_at = excluded.starts_at, ends_at = excluded.ends_at,
           location_name = excluded.location_name, registration_url = excluded.registration_url,
           source_url = excluded.source_url, external_url = excluded.external_url,
           scraped_at = excluded.scraped_at, image_url = excluded.image_url`
      ).bind(postId, startsAt, endsAt, location || null, externalUrl || null, sourceUrl || null, externalUrl || null, externalId, scrapedAt, imageUrl || null),
    ]);
    imported++;
  }

  return Response.json({ imported, skipped, received: records.length });
}

function normalizeScrapedTime(value: string) {
  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = Number(match[2] || "0");
  const meridiem = match[3]?.toUpperCase();
  if (minute > 59 || hour > (meridiem ? 12 : 23) || hour < (meridiem ? 1 : 0)) return "";
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (meridiem === "PM" && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeScrapedUrl(value: string) {
  let normalized = value.trim();
  for (let index = 0; index < 3; index++) {
    const next = normalized
      .replace(/&amp;/gi, "&")
      .replace(/&#38;/g, "&")
      .replace(/&#x26;/gi, "&");
    if (next === normalized) {
      break;
    }
    normalized = next;
  }
  return normalized;
}

function sectionFromPath(pathname: string) {
  const sections: Record<string, string> = {
    "/legislation": "legislation",
    "/events": "event",
    "/projects": "project",
    "/updates": "update",
  };
  return sections[pathname] ?? "";
}

function sectionMeta(section: string) {
  const sections: Record<string, { title: string; singularLower: string; pluralLower: string; path: string; description: string }> = {
    legislation: {
      title: "Legislation",
      singularLower: "legislation note",
      pluralLower: "legislation notes",
      path: "/legislation",
      description: "Share bill tracking notes, hearings, testimony needs, positions, and legislative context.",
    },
    event: {
      title: "Events",
      singularLower: "event",
      pluralLower: "events",
      path: "/events",
      description: "Share meetings, trainings, actions, coalition gatherings, and dates members should know about.",
    },
    project: {
      title: "Projects",
      singularLower: "project",
      pluralLower: "projects",
      path: "/projects",
      description: "Coordinate shared work, working groups, deliverables, and cross-organization collaboration.",
    },
    update: {
      title: "Updates",
      singularLower: "update",
      pluralLower: "updates",
      path: "/updates",
      description: "Post general updates, announcements, requests, and community notes.",
    },
  };
  return sections[section] ?? sections.update;
}

function sectionLabel(section: string) {
  return sectionMeta(section).title;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match?.[1] ?? "";
}

function excerpt(value: string, max: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 1)}...` : normalized;
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
