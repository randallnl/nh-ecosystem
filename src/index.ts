import { Hono } from "hono";
import { createPostsRouter } from "./routes/posts";

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

type Affiliation = {
  id: string;
  name: string;
  slug: string;
};

const SESSION_COOKIE = "nhse_session";
const SESSION_DAYS = 30;
const TOKEN_MINUTES = 20;
const FROM_EMAIL = "no-reply@nhsolidarityecosystem.com";
const FROM_NAME = "NH Solidarity Ecosystem";

const baseStyles = String.raw`
  :root {
    color-scheme: light;
    --ink: #0f172a;
    --muted: #64748b;
    --paper: #f8fafc;
    --panel: #ffffff;
    --line: #e2e8f0;
    --line-strong: #cbd5e1;
    --accent: #2563eb;
    --accent-2: #0ea5e9;
    --accent-3: #0369a1;
    --soft-blue: #eff6ff;
    --danger: #dc2626;
    --radius-xl: 22px;
    --radius-lg: 16px;
    --radius-md: 12px;
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
    background: var(--paper);
  }

  body::before {
    content: none;
  }

  main {
    position: relative;
    width: min(1280px, calc(100% - 32px));
    min-height: 100vh;
    margin: 0 auto;
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: 28px;
    padding: 16px 0 38px;
  }

  .nav {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 12px 6px;
    border: 1px solid var(--line);
    border-left: 0;
    border-right: 0;
    border-radius: 0;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(14px);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    color: var(--ink);
    font-weight: 850;
    text-decoration: none;
    letter-spacing: 0.01em;
  }

  .brand-mark {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;
    border-radius: var(--radius-pill);
    color: #ffffff;
    background: var(--ink);
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
    padding: 8px 12px;
    border-radius: var(--radius-pill);
    font: inherit;
    font-size: 0.92rem;
    font-weight: 700;
    text-decoration: none;
  }

  .nav-links a,
  .nav-links span {
    position: relative;
    color: #475569;
  }

  .nav-links a::after {
    position: absolute;
    right: 12px;
    bottom: 4px;
    left: 12px;
    height: 2px;
    content: "";
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.2s ease;
  }

  .nav-links a:hover {
    color: var(--ink);
  }

  .nav-links a:hover::after {
    transform: scaleX(1);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
    gap: 36px;
    align-items: center;
  }

  .eyebrow,
  .badge {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    border-radius: var(--radius-pill);
    font-weight: 850;
  }

  .eyebrow {
    gap: 7px;
    margin: 0 0 16px;
    padding: 6px 10px;
    border: 1px solid var(--line);
    color: var(--accent);
    background: var(--soft-blue);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    max-width: 840px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(2.8rem, 7vw, 6.4rem);
    line-height: 0.95;
    letter-spacing: 0;
  }

  h2,
  h3,
  p {
    margin-top: 0;
  }

  .lede {
    max-width: 690px;
    margin: 22px 0 0;
    color: var(--muted);
    font-size: clamp(1rem, 1.7vw, 1.18rem);
    line-height: 1.58;
  }

  .actions {
    margin-top: 26px;
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
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
  }

  .button.secondary,
  button.secondary {
    color: var(--accent);
    border-color: var(--line);
    background: #ffffff;
  }

  .button.danger,
  button.danger {
    color: var(--danger);
    border-color: #fecaca;
    background: #ffffff;
  }

  .status {
    margin-top: 20px;
  }

  .status span {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 6px 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    background: #ffffff;
    color: #475569;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .panel,
  .auth-card,
  .tile {
    border: 1px solid var(--line);
    background: var(--panel);
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
  }

  .panel {
    position: relative;
    overflow: clip;
    border-radius: var(--radius-lg);
    padding: 22px;
  }

  .panel::before {
    content: none;
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
    font-family: Georgia, "Times New Roman", serif;
    font-size: 1.25rem;
  }

  .badge {
    padding: 5px 9px;
    color: var(--accent);
    background: var(--soft-blue);
    font-size: 0.68rem;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    text-decoration: none;
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
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: #ffffff;
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
    box-shadow: 0 10px 22px rgba(37, 99, 235, 0.16);
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

  .tag-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag-picker label {
    display: inline-flex;
    grid-auto-flow: column;
    align-items: center;
    width: auto;
    min-height: 36px;
    padding: 7px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-pill);
    color: var(--accent);
    background: var(--soft-blue);
    font-size: 0.82rem;
  }

  .tag-picker input {
    width: auto;
    min-height: auto;
    margin: 0;
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
    min-height: 124px;
    padding: 18px;
    border-radius: var(--radius-md);
  }

  .bar div {
    border: 1px solid var(--line);
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
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

  .field-group {
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
    background: #ffffff;
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
    background: var(--soft-blue);
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
    width: min(980px, 100%);
    margin-inline: auto;
  }

  .dashboard-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.48fr);
    gap: 24px;
    padding: 28px;
    border-radius: var(--radius-lg);
    border-top: 4px solid var(--ink);
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
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: #ffffff;
    transition: border-color 0.18s ease, transform 0.18s ease;
  }

  .post-preview:hover {
    border-color: var(--line-strong);
    transform: translateY(-2px);
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
    background: #e2e8f0;
  }

  .video-embed-card {
    margin: 18px 0;
    display: grid;
    justify-items: start;
  }

  .video-thumb {
    width: 100%;
    max-width: 360px;
    aspect-ratio: 9 / 16;
    object-fit: cover;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--soft-blue);
  }

  .tiktok-embed {
    width: min(100%, 605px);
    margin: 0;
  }

  .event-photo {
    display: block;
    width: 100%;
    max-height: 360px;
    object-fit: contain;
    border-radius: var(--radius-md);
    background: #f1f5f9;
  }

  .event-detail-title {
    max-width: 860px;
    font-size: clamp(2rem, 4vw, 3.7rem);
    line-height: 1.03;
  }

  .event-detail-body {
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(220px, 0.72fr);
    gap: 28px;
    align-items: start;
    margin-top: 18px;
  }

  .event-detail-copy {
    min-width: 0;
    max-width: 520px;
  }

  .event-detail-copy .lede {
    margin-top: 0;
    color: #1b2f4a;
    font-size: 1rem;
    line-height: 1.58;
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
    border-radius: var(--radius-md);
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
    border-top: 0;
  }

  .composer {
    margin-top: 0;
  }

  [x-cloak] {
    display: none !important;
  }

  .composer input[name="title"] {
    min-height: 56px;
    border-radius: var(--radius-md);
    padding-inline: 18px;
    font-weight: 750;
  }

  .composer-extra {
    display: none;
    gap: 14px;
  }

  .composer:focus-within .composer-extra,
  .composer-extra[style*="display: block"] {
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
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: #ffffff;
    transition: border-color 0.18s ease, transform 0.18s ease;
  }

  .compact-list li:hover {
    border-color: var(--line-strong);
    transform: translateY(-1px);
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
    background: #e2e8f0;
  }

  .list-copy {
    display: grid;
    gap: 8px;
  }

  .list-copy p {
    margin: 0;
  }

  .comment-preview {
    display: grid;
    gap: 6px;
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px solid rgba(154, 184, 217, 0.28);
  }

  .comment-preview p {
    margin: 0;
    color: #334155;
    font-size: 0.88rem;
    line-height: 1.42;
  }

  .event-filter-form {
    display: grid;
    grid-template-columns: minmax(150px, 0.7fr) minmax(180px, 1fr) minmax(180px, 1.2fr) auto;
    gap: 10px;
    align-items: end;
    margin-top: 0;
  }

  .event-card-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .event-card {
    display: grid;
    grid-template-columns: 128px minmax(0, 1fr);
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: #ffffff;
    box-shadow: none;
    transition: border-color 0.18s ease, transform 0.18s ease;
  }

  .event-card:hover {
    border-color: var(--line-strong);
    transform: translateY(-2px);
  }

  .event-card.no-image {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .event-card-media {
    display: grid;
    gap: 8px;
    align-self: start;
  }

  .event-card-image {
    width: 128px;
    height: 96px;
    border-radius: var(--radius-md);
    object-fit: cover;
    align-self: start;
    background: var(--soft-blue);
  }

  .event-datebox {
    display: grid;
    align-content: center;
    justify-content: center;
    min-height: 48px;
    padding: 6px 8px;
    border-radius: var(--radius-pill);
    color: #ffffff;
    background: var(--ink);
    text-align: center;
  }

  .event-datebox span {
    font-size: 0.66rem;
    font-weight: 850;
    text-transform: uppercase;
  }

  .event-datebox strong {
    font-size: 1.08rem;
    line-height: 1;
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

    .event-filter-form,
    .event-card-list {
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

    .event-card,
    .event-card.no-image {
      grid-template-columns: 1fr;
    }

    .event-card-image {
      width: 100%;
      height: 150px;
    }

    .event-card.no-image .event-datebox {
      width: min(92px, 100%);
    }
  }
`;

const app = new Hono<{ Bindings: Env }>();

app.route(
  "/posts",
  createPostsRouter<Env>({
    assertSameOrigin,
    currentUser: currentRequestUser,
    renderEventEditPage,
    renderPostDetail,
    handleApprovePost: handleApproveEvent,
    handleCreateComment,
    handleCreatePost,
    handleRejectPost: handleRejectEvent,
    handleRemovePost: handleRemoveEvent,
    handleUpdatePost: handleUpdateEvent,
    html,
  })
);

app.all("*", (c) => handleRequest(c.req.raw, c.env));

app.onError((error) => handleRouteError(error));

export default app;

async function currentRequestUser(request: Request, env: Env) {
  const session = await getSession(request, env);
  return requireUser(session.user);
}

function handleRouteError(error: Error) {
  if (error instanceof RedirectError) {
    return redirect(error.location);
  }

  if (error instanceof HttpError) {
    return html(renderError(error.title, error.message), error.status);
  }

  console.error(error);
  return html(renderError("Something went sideways", "The request could not be completed."), 500);
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
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

      if (request.method === "POST" && url.pathname === "/admin/affiliations") {
        assertSameOrigin(request);
        const user = requireUser(session.user);
        requireSiteAdmin(user);
        return handleCreateAffiliation(request, env, user);
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
        return html(await renderSectionPage(env, user, section, url.searchParams));
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
}

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

  const postRows = await env.DB.prepare(
    `SELECT p.id, p.section, p.author_user_id, p.organization_id
     FROM posts p
     WHERE p.status = 'published'`
  ).all<{ id: string; section: string; author_user_id: string; organization_id: string | null }>();
  const recentPosts = await env.DB.prepare(
    `SELECT p.id, p.section, p.title, p.body, p.created_at, p.author_user_id, p.organization_id,
      o.name AS organization_name, o.logo_object_key AS organization_logo_object_key,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'published') AS comment_count
     FROM posts p
     LEFT JOIN organizations o ON o.id = p.organization_id
     WHERE p.status = 'published'
     ORDER BY comment_count DESC, p.created_at DESC
     LIMIT 80`
  ).all<{ id: string; section: string; title: string; body: string; created_at: string; author_user_id: string; organization_id: string | null; organization_name: string | null; organization_logo_object_key: string | null; comment_count: number }>();

  const visiblePostRows = await filterVisiblePosts(env, user, postRows.results ?? []);
  const countBySection = new Map<string, number>();
  for (const post of visiblePostRows) {
    countBySection.set(post.section, (countBySection.get(post.section) ?? 0) + 1);
  }
  const visibleRecentPosts = (await filterVisiblePosts(env, user, recentPosts.results ?? [])).slice(0, 6);
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
  const recentPostItems = visibleRecentPosts.length
    ? visibleRecentPosts
        .map((post) => `<li><strong><a href="/posts/${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></strong><br /><span class="muted">${escapeHtml(sectionLabel(post.section))}${post.organization_name ? ` · ${escapeHtml(post.organization_name)}` : ""} · ${escapeHtml(formatDate(post.created_at))}</span></li>`)
        .join("")
    : `<li><strong>No posts in your affiliations yet</strong><br /><span class="muted">Posts appear here when people or organizations in your affiliations publish.</span></li>`;
  const heroPreviews = renderHeroPreviews(visibleRecentPosts);

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
          <span class="badge">${visibleRecentPosts.length} shown</span>
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

async function renderSectionPage(env: Env, user: User, section: string, searchParams = new URLSearchParams()) {
  const meta = sectionMeta(section);
  const [posts, writableOrganizations] = await Promise.all([
    env.DB.prepare(
      `SELECT p.id, p.title, p.body, p.created_at, p.organization_id, o.name AS organization_name, o.slug AS organization_slug,
        o.logo_object_key AS organization_logo_object_key, u.id AS author_user_id, u.name AS author_name, u.email AS author_email,
        COALESCE(e.image_url, v.thumbnail_url) AS image_url, e.starts_at, e.location_name,
        v.provider AS video_provider, v.source_url AS video_source_url, v.video_id AS video_id,
        v.title AS video_title, v.author_name AS video_author_name, v.author_url AS video_author_url, v.thumbnail_url AS video_thumbnail_url,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'published') AS comment_count
       FROM posts p
       LEFT JOIN organizations o ON o.id = p.organization_id
       LEFT JOIN events e ON e.post_id = p.id
       LEFT JOIN video_embeds v ON v.post_id = p.id
       JOIN users u ON u.id = p.author_user_id
       WHERE p.section = ? AND p.status = 'published'
       ORDER BY p.created_at DESC
       LIMIT 200`
    ).bind(section).all<{
      id: string;
      title: string;
      body: string;
      created_at: string;
      organization_id: string | null;
      organization_name: string | null;
      organization_slug: string | null;
      organization_logo_object_key: string | null;
      author_user_id: string;
      author_name: string | null;
      author_email: string;
      image_url: string | null;
      starts_at: string | null;
      location_name: string | null;
      video_provider: string | null;
      video_source_url: string | null;
      video_id: string | null;
      video_title: string | null;
      video_author_name: string | null;
      video_author_url: string | null;
      video_thumbnail_url: string | null;
      comment_count: number;
    }>(),
    getWritableOrganizations(env, user),
  ]);
  const visibleUnfilteredPosts = await filterVisiblePosts(env, user, posts.results ?? []);
  const visiblePosts = applySectionFilters(visibleUnfilteredPosts, section, searchParams).slice(0, 40);
  const commentPreviewMap = await getCommentPreviews(env, user, visiblePosts.map((post) => post.id));

  const canCreate = user.site_role === "site_admin" || writableOrganizations.length > 0;
  const postItems = visiblePosts.length
    ? section === "event"
      ? visiblePosts.map((post) => renderEventFeedCard(post, commentPreviewMap.get(post.id) ?? [])).join("")
      : visiblePosts
        .map((post) => String.raw`
          <li class="${post.image_url ? "with-image" : ""}">
            ${post.image_url ? `<img class="list-thumb" src="${escapeHtml(post.image_url)}" alt="" loading="lazy" />` : ""}
            <div class="list-copy">
              <strong><a href="/posts/${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></strong>
              <p class="muted">${escapeHtml(excerpt(post.body, 180))}</p>
              <div class="meta">
                ${post.organization_name ? renderOrganizationPill(post.organization_name, post.organization_logo_object_key) : `<span class="badge">Ecosystem-wide</span>`}
                ${renderMemberLink(post.author_user_id, post.author_name || post.author_email, "badge")}
                ${post.video_provider ? `<span class="badge">TikTok video</span>` : ""}
                <span class="badge">${escapeHtml(formatDate(post.created_at))}</span>
                <span class="badge">${Number(post.comment_count)} comments</span>
              </div>
              ${renderCommentPreviews(commentPreviewMap.get(post.id) ?? [])}
            </div>
          </li>
        `)
        .join("")
    : `<li><strong>No ${escapeHtml(meta.pluralLower)} in your affiliations yet</strong><br /><span class="muted">When affiliated members or organizations publish here, the latest posts will appear in this section.</span></li>`;
  const heroPreviews = renderHeroPreviews(visiblePosts);

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

        ${section === "event" ? renderEventFilters(visibleUnfilteredPosts, searchParams) : ""}

        <aside class="panel">
          <div class="panel-head">
            <h2>Recent ${escapeHtml(meta.pluralLower)}</h2>
            <span class="badge">${visiblePosts.length} shown</span>
          </div>
          <ul class="${section === "event" ? "event-card-list" : "compact-list"}">${postItems}</ul>
        </aside>
      </section>
    </section>
  `, user);
}

function renderHeroPreviews(
  posts: Array<{ id: string; title: string; body?: string; section?: string; organization_name?: string | null; organization_logo_object_key?: string | null; comment_count?: number; image_url?: string | null; video_provider?: string | null }>
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
            <p class="muted">${post.organization_name ? `${escapeHtml(post.organization_name)} · ` : ""}${post.video_provider ? "TikTok video · " : ""}${Number(post.comment_count ?? 0)} comments${post.section ? ` · ${escapeHtml(sectionLabel(post.section))}` : ""}</p>
          </div>
        `)
        .join("")}
    </div>
  `;
}

type FeedPost = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  organization_id: string | null;
  organization_name: string | null;
  organization_slug: string | null;
  organization_logo_object_key: string | null;
  author_user_id: string;
  author_name: string | null;
  author_email: string;
  image_url: string | null;
  starts_at: string | null;
  location_name: string | null;
  video_provider: string | null;
  video_source_url: string | null;
  video_id: string | null;
  video_title: string | null;
  video_author_name: string | null;
  video_author_url: string | null;
  video_thumbnail_url: string | null;
  comment_count: number;
};

type CommentPreview = {
  id: string;
  body: string;
  created_at: string;
  author_user_id: string;
  author_name: string | null;
  author_email: string;
};

function applySectionFilters<T extends FeedPost>(posts: T[], section: string, searchParams: URLSearchParams) {
  if (section !== "event") {
    return posts;
  }

  const range = searchParams.get("range") || "upcoming";
  const organization = searchParams.get("organization") || "";
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const now = new Date();

  return posts.filter((post) => {
    const eventDate = post.starts_at ? new Date(post.starts_at) : null;
    if (range === "upcoming" && eventDate && eventDate < startOfToday(now)) {
      return false;
    }
    if (range === "past" && (!eventDate || eventDate >= startOfToday(now))) {
      return false;
    }
    if (organization && post.organization_id !== organization) {
      return false;
    }
    if (query) {
      const haystack = `${post.title} ${post.body} ${post.organization_name || ""} ${post.location_name || ""}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
}

function renderEventFilters(posts: FeedPost[], searchParams: URLSearchParams) {
  const range = searchParams.get("range") || "upcoming";
  const organization = searchParams.get("organization") || "";
  const query = searchParams.get("q") || "";
  const organizations = [...new Map(
    posts
      .filter((post) => post.organization_id && post.organization_name)
      .map((post) => [post.organization_id, post.organization_name])
  ).entries()];

  return String.raw`
    <aside class="panel">
      <div class="panel-head">
        <h2>Filter events</h2>
        <span class="badge">Calendar view</span>
      </div>
      <form class="event-filter-form" method="get" action="/events">
        <label>
          Date
          <select name="range">
            <option value="upcoming" ${range === "upcoming" ? "selected" : ""}>Upcoming</option>
            <option value="all" ${range === "all" ? "selected" : ""}>All</option>
            <option value="past" ${range === "past" ? "selected" : ""}>Past</option>
          </select>
        </label>
        <label>
          Organization
          <select name="organization">
            <option value="">All affiliated orgs</option>
            ${organizations.map(([id, name]) => `<option value="${escapeHtml(id || "")}" ${organization === id ? "selected" : ""}>${escapeHtml(name || "")}</option>`).join("")}
          </select>
        </label>
        <label>
          Search
          <input name="q" type="search" value="${escapeHtml(query)}" placeholder="Title, location, organization" />
        </label>
        <button class="secondary" type="submit">Apply</button>
      </form>
    </aside>
  `;
}

function renderEventFeedCard(post: FeedPost, comments: CommentPreview[]) {
  return String.raw`
    <li class="event-card${post.image_url ? "" : " no-image"}">
      <div class="event-card-media">
        <div class="event-datebox">
          <span>${escapeHtml(eventMonth(post.starts_at))}</span>
          <strong>${escapeHtml(eventDay(post.starts_at))}</strong>
        </div>
        ${post.image_url ? `<img class="event-card-image" src="${escapeHtml(post.image_url)}" alt="" loading="lazy" />` : ""}
      </div>
      <div class="list-copy">
        <strong><a href="/posts/${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></strong>
        <p class="muted">${escapeHtml(excerpt(post.body, 150))}</p>
        <div class="meta">
          ${post.organization_name ? renderOrganizationPill(post.organization_name, post.organization_logo_object_key) : `<span class="badge">Ecosystem-wide</span>`}
          ${post.starts_at ? `<span class="badge">${escapeHtml(formatDate(post.starts_at))}</span>` : ""}
          ${post.location_name ? `<span class="badge">${escapeHtml(post.location_name)}</span>` : ""}
          <span class="badge">${Number(post.comment_count)} comments</span>
        </div>
        ${renderCommentPreviews(comments)}
      </div>
    </li>
  `;
}

async function getCommentPreviews(env: Env, user: User, postIds: string[]) {
  const previews = new Map<string, CommentPreview[]>();
  for (const postId of postIds) {
    const comments = await env.DB.prepare(
      `SELECT c.id, c.body, c.created_at, u.id AS author_user_id, u.name AS author_name, u.email AS author_email
       FROM comments c
       JOIN users u ON u.id = c.author_user_id
       WHERE c.post_id = ? AND c.status = 'published'
       ORDER BY c.created_at DESC
       LIMIT 4`
    )
      .bind(postId)
      .all<CommentPreview>();
    previews.set(postId, (await filterVisiblePeopleRows(env, user, comments.results ?? [], (comment) => comment.author_user_id)).slice(0, 2));
  }
  return previews;
}

function renderCommentPreviews(comments: CommentPreview[]) {
  if (!comments.length) {
    return "";
  }
  return String.raw`
    <div class="comment-preview">
      ${comments.map((comment) => `<p><strong>${renderMemberLink(comment.author_user_id, comment.author_name || comment.author_email)}</strong>: ${escapeHtml(excerpt(comment.body, 110))}</p>`).join("")}
    </div>
  `;
}

function eventMonth(value: string | null) {
  if (!value) return "TBD";
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(value));
}

function eventDay(value: string | null) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(new Date(value));
}

function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function renderPostForm(section: string, organizations: Array<{ id: string; name: string }>, user: User) {
  const organizationOptions = [
    ...(user.site_role === "site_admin" ? [`<option value="">Ecosystem-wide</option>`] : []),
    ...organizations.map((organization) => `<option value="${escapeHtml(organization.id)}">${escapeHtml(organization.name)}</option>`),
  ].join("");

  return String.raw`
    <form class="composer" method="post" action="/posts" x-data="{ open: false }">
      <input name="section" type="hidden" value="${escapeHtml(section)}" />
      <label>
        <span class="sr-only">Title</span>
        <input name="title" type="text" required placeholder="Create ${escapeHtml(sectionMeta(section).singularLower)}" x-on:focus="open = true" x-on:click="open = true" />
      </label>
      <div class="composer-extra" x-show="open" x-transition>
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
        ${section === "update" ? String.raw`
          <label>
            TikTok URL
            <input name="tiktok_url" type="url" placeholder="https://www.tiktok.com/@account/video/123..." />
          </label>
          <p class="muted">Updates with TikTok videos are submitted for admin or organization admin approval before they appear.</p>
        ` : ""}
        <button class="primary" type="submit">${section === "update" ? "Publish or submit" : "Publish"}</button>
      </div>
    </form>
  `;
}

async function renderPostDetail(env: Env, user: User, postId: string) {
  const post = await env.DB.prepare(
    `SELECT p.id, p.section, p.title, p.body, p.visibility, p.status, p.created_at, p.organization_id,
      e.starts_at, e.ends_at, e.location_name, e.registration_url, e.external_url, e.image_url,
      v.provider AS video_provider, v.source_url AS video_source_url, v.video_id, v.title AS video_title,
      v.author_name AS video_author_name, v.author_url AS video_author_url, v.thumbnail_url AS video_thumbnail_url,
      o.name AS organization_name, o.slug AS organization_slug, o.logo_object_key AS organization_logo_object_key,
      u.id AS author_user_id, u.name AS author_name, u.email AS author_email
     FROM posts p
     LEFT JOIN events e ON e.post_id = p.id
     LEFT JOIN video_embeds v ON v.post_id = p.id
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
      video_provider: string | null;
      video_source_url: string | null;
      video_id: string | null;
      video_title: string | null;
      video_author_name: string | null;
      video_author_url: string | null;
      video_thumbnail_url: string | null;
      organization_name: string | null;
      organization_slug: string | null;
      organization_logo_object_key: string | null;
      author_user_id: string;
      author_name: string | null;
      author_email: string;
    }>();

  if (!post || post.status !== "published") {
    throw new HttpError(404, "Post not found", "That post does not exist or is not published.");
  }

  await requireCanReadPost(env, user, post.organization_id, post.visibility);
  await requireCanViewPostAudience(env, user, post.author_user_id, post.organization_id);
  const canEditEvent = post.section === "event" && await canManageEvent(env, user, post.organization_id);

  const visibleComments = await getVisiblePostComments(env, user, post.id);
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
          ${renderMemberLink(post.author_user_id, post.author_name || post.author_email, "badge")}
          ${post.starts_at ? `<span class="badge">${escapeHtml(formatDate(post.starts_at))}</span>` : ""}
          ${post.location_name ? `<span class="badge">${escapeHtml(post.location_name)}</span>` : ""}
        </div>
        <div class="event-detail-body">
          ${post.image_url ? `<img class="event-photo" src="${escapeHtml(post.image_url)}" alt="" loading="lazy" />` : ""}
          <div class="event-detail-copy">
            <p class="post-body lede">${escapeHtml(post.body)}</p>
            ${renderVideoEmbed(post)}
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
          <form method="post" action="/posts/${escapeHtml(post.id)}/comments" hx-post="/posts/${escapeHtml(post.id)}/comments" hx-target="#comments-panel" hx-swap="outerHTML">
            <label>
              Comment
              <textarea name="body" required></textarea>
            </label>
            <button class="primary" type="submit">Comment</button>
          </form>
        </aside>

        ${renderCommentsPanel(visibleComments)}
      </section>
    </section>
  `, user);
}

async function getVisiblePostComments(env: Env, user: User, postId: string) {
  const comments = await env.DB.prepare(
    `SELECT c.id, c.body, c.created_at, u.id AS author_user_id, u.name AS author_name, u.email AS author_email
     FROM comments c
     JOIN users u ON u.id = c.author_user_id
     WHERE c.post_id = ? AND c.status = 'published'
     ORDER BY c.created_at`
  )
    .bind(postId)
    .all<CommentPreview>();
  return filterVisiblePeopleRows(env, user, comments.results ?? [], (comment) => comment.author_user_id);
}

function renderCommentsPanel(comments: CommentPreview[]) {
  const commentItems = comments.length
    ? comments
        .map((comment) => `<li><strong>${renderMemberLink(comment.author_user_id, comment.author_name || comment.author_email)}</strong><br /><span class="muted">${escapeHtml(formatDate(comment.created_at))}</span><p class="post-body">${escapeHtml(comment.body)}</p></li>`)
        .join("")
    : `<li><strong>No comments yet</strong><br /><span class="muted">Start the discussion below.</span></li>`;

  return String.raw`
    <aside class="panel" id="comments-panel">
      <div class="panel-head">
        <h2>Comments</h2>
        <span class="badge">${comments.length} shown</span>
      </div>
      <ul class="compact-list">${commentItems}</ul>
    </aside>
  `;
}

function renderVideoEmbed(post: {
  video_provider?: string | null;
  video_source_url?: string | null;
  video_id?: string | null;
  video_title?: string | null;
  video_author_name?: string | null;
  video_author_url?: string | null;
  video_thumbnail_url?: string | null;
}) {
  if (post.video_provider !== "tiktok" || !post.video_source_url) {
    return "";
  }
  const authorUrl = post.video_author_url || post.video_source_url;
  const authorLabel = post.video_author_name ? `@${post.video_author_name.replace(/^@/, "")}` : "TikTok";
  return String.raw`
    <div class="video-embed-card">
      <blockquote
        class="tiktok-embed"
        cite="${escapeHtml(post.video_source_url)}"
        ${post.video_id ? `data-video-id="${escapeHtml(post.video_id)}"` : ""}
        style="max-width: 605px; min-width: 325px;"
      >
        <section>
          <a target="_blank" rel="noopener noreferrer" href="${escapeHtml(authorUrl)}">${escapeHtml(authorLabel)}</a>
          ${post.video_title ? `<p>${escapeHtml(post.video_title)}</p>` : ""}
        </section>
      </blockquote>
      <script async src="https://www.tiktok.com/embed.js"></script>
    </div>
  `;
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
  const post = await getModeratablePost(env, postId, "draft");
  await requireCanManagePostReview(env, user, post);
  const returnTo = await reviewReturnPath(request);

  await env.DB.prepare(
    "UPDATE posts SET status = 'published', archived_at = NULL, updated_at = ? WHERE id = ?"
  )
    .bind(new Date().toISOString(), post.id)
    .run();
  await writeAudit(env, user.id, `${post.section}.approved`, "post", post.id, {
    organization_id: post.organization_id || null,
  });
  return redirect(returnTo);
}

async function handleRejectEvent(request: Request, env: Env, user: User, postId: string) {
  const post = await getModeratablePost(env, postId, "draft");
  await requireCanManagePostReview(env, user, post);
  const returnTo = await reviewReturnPath(request);

  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE posts SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ?"
  )
    .bind(now, now, post.id)
    .run();
  await writeAudit(env, user.id, `${post.section}.rejected`, "post", post.id, {
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
  const tiktokUrl = normalizeOptionalUrl(form.get("tiktok_url"));

  if (!section || !title || !body) {
    throw new HttpError(400, "Post details required", "Choose a section and include a title and body.");
  }

  if (tiktokUrl && section !== "update") {
    throw new HttpError(400, "Video updates only", "TikTok videos can be attached to updates.");
  }

  if (!organizationId && user.site_role !== "site_admin") {
    throw new HttpError(403, "Organization required", "Choose an organization you can post for.");
  }

  if (organizationId) {
    await requireCanPostForOrganization(env, user, organizationId);
  }

  const postId = crypto.randomUUID();
  const videoEmbed = tiktokUrl ? await fetchTikTokEmbed(tiktokUrl) : null;
  const status = videoEmbed ? "draft" : "published";
  const statements = [
    env.DB.prepare(
      `INSERT INTO posts (id, organization_id, author_user_id, section, title, body, visibility, status)
       VALUES (?, ?, ?, ?, ?, ?, 'members', ?)`
    )
      .bind(postId, organizationId || null, user.id, section, title, body, status),
  ];

  if (videoEmbed) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO video_embeds (post_id, provider, source_url, video_id, title, author_name, author_url, thumbnail_url)
         VALUES (?, 'tiktok', ?, ?, ?, ?, ?, ?)`
      ).bind(
        postId,
        videoEmbed.sourceUrl,
        videoEmbed.videoId || null,
        videoEmbed.title || null,
        videoEmbed.authorName || null,
        videoEmbed.authorUrl || null,
        videoEmbed.thumbnailUrl || null
      )
    );
  }

  await env.DB.batch(statements);

  await writeAudit(env, user.id, videoEmbed ? "video.submitted" : "post.created", "post", postId, {
    section,
    organization_id: organizationId || null,
    provider: videoEmbed ? "tiktok" : null,
  });
  return redirect(videoEmbed ? "/updates" : `/posts/${postId}`);
}

async function handleCreateComment(request: Request, env: Env, user: User, postId: string) {
  const post = await env.DB.prepare("SELECT id, author_user_id, organization_id, visibility, status FROM posts WHERE id = ?")
    .bind(postId)
    .first<{ id: string; author_user_id: string; organization_id: string | null; visibility: string; status: string }>();

  if (!post || post.status !== "published") {
    throw new HttpError(404, "Post not found", "That post does not exist or is not published.");
  }

  await requireCanReadPost(env, user, post.organization_id, post.visibility);
  await requireCanViewPostAudience(env, user, post.author_user_id, post.organization_id);

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
  if (isHtmxRequest(request)) {
    return html(renderCommentsPanel(await getVisiblePostComments(env, user, post.id)));
  }
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
  const affiliations = await getAffiliations(env);
  const recentUsers = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.site_role, u.status, GROUP_CONCAT(o.name || ' (' || m.role || ')', ', ') AS organizations
     FROM users u
     LEFT JOIN organization_memberships m ON m.user_id = u.id
     LEFT JOIN organizations o ON o.id = m.organization_id
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT 8`
  ).all<{ id: string; email: string; name: string | null; site_role: string; status: string; organizations: string | null }>();
  const [pendingEvents, pendingVideos] = await Promise.all([
    getPendingEvents(env, user),
    getPendingVideos(env, user),
  ]);

  const users = Number((stats[0].results?.[0] as { count?: number } | undefined)?.count ?? 0);
  const invites = Number((stats[1].results?.[0] as { count?: number } | undefined)?.count ?? 0);
  const sessions = Number((stats[2].results?.[0] as { count?: number } | undefined)?.count ?? 0);
  const organizationOptions = organizations.results?.length
    ? organizations.results.map((organization) => `<option value="${escapeHtml(organization.id)}">${escapeHtml(organization.name)}</option>`).join("")
    : "";
  const affiliationPicker = renderAffiliationPicker(affiliations, new Set());
  const organizationItems = organizations.results?.length
    ? organizations.results
        .map((organization) => `<li><strong><a href="/organizations/${escapeHtml(organization.slug)}">${escapeHtml(organization.name)}</a></strong><br /><span class="muted">${escapeHtml(organization.slug)}${organization.contact_email ? ` · ${escapeHtml(organization.contact_email)}` : ""} · ${escapeHtml(organization.status)}${organization.event_source_url ? ` · Event Page URL set` : ""}${organization.event_scraping_enabled ? " · scraping enabled" : ""}</span></li>`)
        .join("")
    : `<li><strong>No organizations yet</strong><br /><span class="muted">Create the first member organization with the form.</span></li>`;
  const userItems = recentUsers.results?.length
    ? recentUsers.results
        .map((member) => `<li><strong>${renderMemberLink(member.id, member.name || member.email)}</strong><br /><span class="muted">${escapeHtml(member.email)} · ${escapeHtml(member.site_role)} · ${escapeHtml(member.status)}${member.organizations ? ` · ${escapeHtml(member.organizations)}` : ""} · <a href="/admin/users/${escapeHtml(member.id)}">Admin edit</a></span></li>`)
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
      ${renderPendingVideoReview(pendingVideos, "/admin")}

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
            <div class="field-group">
              <span>Affiliations</span>
              ${affiliationPicker}
            </div>
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
            <h2>Add affiliation</h2>
            <span class="badge">Coalition tag</span>
          </div>
          <form method="post" action="/admin/affiliations">
            <label>
              Affiliation name
              <input name="name" type="text" placeholder="Coalition or convening name" required />
            </label>
            <button class="primary" type="submit">Add affiliation</button>
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

  const visibleMembers = await filterVisiblePeopleRows(env, user, members.results ?? [], (member) => member.id);
  const affiliationMap = await getEffectiveAffiliationsByUserIds(env, visibleMembers.map((member) => member.id));
  const renderedMemberItems = visibleMembers.length
    ? visibleMembers
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
              ${renderAffiliationBadges(affiliationMap.get(member.id) ?? [])}
              ${member.bio ? `<p class="muted">${escapeHtml(excerpt(member.bio, 150))}</p>` : ""}
            </div>
          </div>
        `)
        .join("")
    : `<div class="tile"><strong>No member profiles in your affiliations yet</strong><span>Profiles appear here when members in your affiliations make them visible.</span></div>`;

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
        ${renderedMemberItems}
      </section>
    </section>
  `, user);
}

async function renderMemberProfile(env: Env, user: User, memberId: string) {
  const member = await getMemberProfile(env, memberId);
  if (!member || member.status !== "active") {
    throw new HttpError(404, "Member not found", "That member profile does not exist or is not visible.");
  }
  await requireCanViewMemberProfile(env, user, member.id);

  const memberships = await getMemberOrganizations(env, member.id);
  const affiliations = await getEffectiveUserAffiliations(env, member.id);
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
            ${renderAffiliationBadges(affiliations)}
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
  const [affiliations, directAffiliationIds, inheritedAffiliations] = await Promise.all([
    getAffiliations(env),
    getDirectUserAffiliationIds(env, user.id),
    getInheritedUserAffiliations(env, user.id),
  ]);

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
        ${renderMemberProfileForm(member, "/profile", false, affiliations, directAffiliationIds, inheritedAffiliations)}
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
  const affiliations = await getAffiliations(env);
  const affiliationIds = cleanAffiliationIds(form, affiliations);

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
  await replaceUserAffiliations(env, user.id, affiliationIds);

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

async function getAffiliations(env: Env) {
  const affiliations = await env.DB.prepare(
    "SELECT id, name, slug FROM affiliations ORDER BY name"
  ).all<Affiliation>();
  return affiliations.results ?? [];
}

async function getOrganizationAffiliationIds(env: Env, organizationId: string) {
  const rows = await env.DB.prepare(
    "SELECT affiliation_id FROM organization_affiliations WHERE organization_id = ?"
  )
    .bind(organizationId)
    .all<{ affiliation_id: string }>();
  return new Set((rows.results ?? []).map((row) => row.affiliation_id));
}

async function getDirectUserAffiliationIds(env: Env, userId: string) {
  const rows = await env.DB.prepare(
    "SELECT affiliation_id FROM user_affiliations WHERE user_id = ?"
  )
    .bind(userId)
    .all<{ affiliation_id: string }>();
  return new Set((rows.results ?? []).map((row) => row.affiliation_id));
}

async function getOrganizationAffiliations(env: Env, organizationId: string) {
  const rows = await env.DB.prepare(
    `SELECT a.id, a.name, a.slug
     FROM organization_affiliations oa
     JOIN affiliations a ON a.id = oa.affiliation_id
     WHERE oa.organization_id = ?
     ORDER BY a.name`
  )
    .bind(organizationId)
    .all<Affiliation>();
  return rows.results ?? [];
}

async function getInheritedUserAffiliations(env: Env, userId: string) {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT a.id, a.name, a.slug
     FROM organization_memberships m
     JOIN organization_affiliations oa ON oa.organization_id = m.organization_id
     JOIN affiliations a ON a.id = oa.affiliation_id
     WHERE m.user_id = ?
     ORDER BY a.name`
  )
    .bind(userId)
    .all<Affiliation>();
  return rows.results ?? [];
}

async function getEffectiveUserAffiliations(env: Env, userId: string) {
  const rows = await env.DB.prepare(
    `SELECT DISTINCT a.id, a.name, a.slug
     FROM affiliations a
     WHERE EXISTS (
       SELECT 1 FROM user_affiliations ua
       WHERE ua.affiliation_id = a.id AND ua.user_id = ?
     )
     OR EXISTS (
       SELECT 1
       FROM organization_memberships m
       JOIN organization_affiliations oa ON oa.organization_id = m.organization_id
       WHERE oa.affiliation_id = a.id AND m.user_id = ?
     )
     ORDER BY a.name`
  )
    .bind(userId, userId)
    .all<Affiliation>();
  return rows.results ?? [];
}

async function getEffectiveUserAffiliationIds(env: Env, userId: string) {
  return new Set((await getEffectiveUserAffiliations(env, userId)).map((affiliation) => affiliation.id));
}

async function getEffectiveAffiliationsByUserIds(env: Env, userIds: string[]) {
  const result = new Map<string, Affiliation[]>();
  for (const userId of userIds) {
    result.set(userId, await getEffectiveUserAffiliations(env, userId));
  }
  return result;
}

async function getOrganizationAffiliationsByIds(env: Env, organizationIds: string[]) {
  const result = new Map<string, Affiliation[]>();
  for (const organizationId of [...new Set(organizationIds.filter(Boolean))]) {
    result.set(organizationId, await getOrganizationAffiliations(env, organizationId));
  }
  return result;
}

function hasAffiliationOverlap(viewerAffiliationIds: Set<string>, affiliations: Affiliation[]) {
  return affiliations.some((affiliation) => viewerAffiliationIds.has(affiliation.id));
}

async function filterVisiblePosts<T extends { author_user_id: string; organization_id: string | null }>(env: Env, user: User, posts: T[]) {
  if (user.site_role === "site_admin") {
    return posts;
  }
  const viewerAffiliationIds = await getEffectiveUserAffiliationIds(env, user.id);
  const authorAffiliations = await getEffectiveAffiliationsByUserIds(env, [...new Set(posts.map((post) => post.author_user_id))]);
  const organizationAffiliations = await getOrganizationAffiliationsByIds(env, posts.map((post) => post.organization_id || ""));
  return posts.filter((post) => {
    if (post.author_user_id === user.id) {
      return true;
    }
    if (!viewerAffiliationIds.size) {
      return false;
    }
    return hasAffiliationOverlap(viewerAffiliationIds, authorAffiliations.get(post.author_user_id) ?? [])
      || (post.organization_id ? hasAffiliationOverlap(viewerAffiliationIds, organizationAffiliations.get(post.organization_id) ?? []) : false);
  });
}

async function filterVisiblePeopleRows<T>(env: Env, user: User, rows: T[], getUserId: (row: T) => string) {
  if (user.site_role === "site_admin") {
    return rows;
  }
  const viewerAffiliationIds = await getEffectiveUserAffiliationIds(env, user.id);
  const userIds = [...new Set(rows.map(getUserId))];
  const affiliationMap = await getEffectiveAffiliationsByUserIds(env, userIds);
  return rows.filter((row) => {
    const userId = getUserId(row);
    return userId === user.id || (viewerAffiliationIds.size > 0 && hasAffiliationOverlap(viewerAffiliationIds, affiliationMap.get(userId) ?? []));
  });
}

async function canViewOrganizationByAffiliation(env: Env, user: User, organizationId: string) {
  if (user.site_role === "site_admin") {
    return true;
  }
  const viewerAffiliationIds = await getEffectiveUserAffiliationIds(env, user.id);
  if (!viewerAffiliationIds.size) {
    return false;
  }
  return hasAffiliationOverlap(viewerAffiliationIds, await getOrganizationAffiliations(env, organizationId));
}

async function requireCanViewMemberProfile(env: Env, user: User, memberId: string) {
  if (user.site_role === "site_admin" || user.id === memberId) {
    return;
  }
  const visible = await filterVisiblePeopleRows(env, user, [{ id: memberId }], (row) => row.id);
  if (!visible.length) {
    throw new HttpError(403, "Affiliation access required", "You need a shared affiliation with this member to view their profile.");
  }
}

async function requireCanViewPostAudience(env: Env, user: User, authorUserId: string, organizationId: string | null) {
  const visible = await filterVisiblePosts(env, user, [{ author_user_id: authorUserId, organization_id: organizationId }]);
  if (!visible.length) {
    throw new HttpError(404, "Post not found", "That post does not exist in your affiliations.");
  }
}

function renderAffiliationPicker(affiliations: Affiliation[], selectedIds: Set<string>) {
  if (!affiliations.length) {
    return `<span class="muted">No affiliations have been added yet.</span>`;
  }
  return String.raw`
    <div class="tag-picker">
      ${affiliations
        .map((affiliation) => String.raw`
          <label>
            <input name="affiliation_id" type="checkbox" value="${escapeHtml(affiliation.id)}" ${selectedIds.has(affiliation.id) ? "checked" : ""} />
            ${escapeHtml(affiliation.name)}
          </label>
        `)
        .join("")}
    </div>
  `;
}

function renderAffiliationBadges(affiliations: Affiliation[]) {
  if (!affiliations.length) {
    return "";
  }
  return `<div class="meta">${affiliations.map((affiliation) => `<span class="badge">${escapeHtml(affiliation.name)}</span>`).join("")}</div>`;
}

function cleanAffiliationIds(form: FormData, affiliations: Affiliation[]) {
  const allowed = new Set(affiliations.map((affiliation) => affiliation.id));
  const selected = new Set<string>();
  for (const value of form.getAll("affiliation_id")) {
    if (typeof value === "string" && allowed.has(value)) {
      selected.add(value);
    }
  }
  return [...selected];
}

async function replaceOrganizationAffiliations(env: Env, organizationId: string, affiliationIds: string[]) {
  const statements = [
    env.DB.prepare("DELETE FROM organization_affiliations WHERE organization_id = ?").bind(organizationId),
    ...affiliationIds.map((affiliationId) => env.DB.prepare(
      "INSERT INTO organization_affiliations (organization_id, affiliation_id) VALUES (?, ?)"
    ).bind(organizationId, affiliationId)),
  ];
  await env.DB.batch(statements);
}

async function replaceUserAffiliations(env: Env, userId: string, affiliationIds: string[]) {
  const statements = [
    env.DB.prepare("DELETE FROM user_affiliations WHERE user_id = ?").bind(userId),
    ...affiliationIds.map((affiliationId) => env.DB.prepare(
      "INSERT INTO user_affiliations (user_id, affiliation_id) VALUES (?, ?)"
    ).bind(userId, affiliationId)),
  ];
  await env.DB.batch(statements);
}

function renderMemberProfileForm(
  member: MemberProfile,
  action: string,
  includeAdminFields: boolean,
  affiliations: Affiliation[] = [],
  selectedAffiliationIds = new Set<string>(),
  inheritedAffiliations: Affiliation[] = []
) {
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
      <div class="field-group">
        <span>Direct affiliations</span>
        ${renderAffiliationPicker(affiliations, selectedAffiliationIds)}
      </div>
      ${inheritedAffiliations.length ? String.raw`
        <div class="notice">
          Organization affiliations inherited from your memberships:
          ${renderAffiliationBadges(inheritedAffiliations)}
        </div>
      ` : ""}
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

function renderMemberLink(userId: string, label: string, className = "") {
  return `<a ${className ? `class="${escapeHtml(className)}" ` : ""}href="/members/${escapeHtml(userId)}">${escapeHtml(label)}</a>`;
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
  const [affiliations, directAffiliationIds, inheritedAffiliations] = await Promise.all([
    getAffiliations(env),
    getDirectUserAffiliationIds(env, member.id),
    getInheritedUserAffiliations(env, member.id),
  ]);
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
          ${renderMemberProfileForm(member, `/admin/users/${member.id}`, true, affiliations, directAffiliationIds, inheritedAffiliations)}
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
  const affiliations = await getAffiliations(env);
  const affiliationIds = cleanAffiliationIds(form, affiliations);

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
  await replaceUserAffiliations(env, existing.id, affiliationIds);

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

  const canEdit = user.site_role === "site_admin" || membership?.role === "org_admin";
  const [affiliations, organizationAffiliationIds, organizationAffiliations] = await Promise.all([
    getAffiliations(env),
    getOrganizationAffiliationIds(env, organization.id),
    getOrganizationAffiliations(env, organization.id),
  ]);

  if (!membership && user.site_role !== "site_admin" && !await canViewOrganizationByAffiliation(env, user, organization.id)) {
    throw new HttpError(403, "Affiliation access required", "You need a shared affiliation with this organization to view its profile.");
  }
  const members = await env.DB.prepare(
    `SELECT u.id, u.name, u.email, m.role
     FROM organization_memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = ?
     ORDER BY m.role DESC, u.name, u.email`
  )
    .bind(organization.id)
    .all<{ id: string; name: string | null; email: string; role: string }>();
  const memberItems = members.results?.length
    ? members.results
        .map((member) => `<li><strong>${renderMemberLink(member.id, member.name || member.email)}</strong><br /><span class="muted">${escapeHtml(member.email)} · ${escapeHtml(formatRole(member.role))}</span></li>`)
        .join("")
    : `<li><strong>No linked members</strong><br /><span class="muted">Invite members from the admin tools.</span></li>`;
  const [pendingEvents, pendingVideos] = canEdit
    ? await Promise.all([
        getPendingEvents(env, user, organization.id),
        getPendingVideos(env, user, organization.id),
      ])
    : [[], []];

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
          ${renderAffiliationBadges(organizationAffiliations)}
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
      ${canEdit ? renderPendingVideoReview(pendingVideos, `/organizations/${organization.slug}`) : ""}

      ${canEdit ? renderOrganizationEditForm(organization, affiliations, organizationAffiliationIds) : ""}
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
}, affiliations: Affiliation[] = [], selectedAffiliationIds = new Set<string>()) {
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
        <div class="field-group">
          <span>Affiliations</span>
          ${renderAffiliationPicker(affiliations, selectedAffiliationIds)}
        </div>
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
  const affiliations = await getAffiliations(env);
  const affiliationIds = cleanAffiliationIds(form, affiliations);

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
  await replaceOrganizationAffiliations(env, organization.id, affiliationIds);

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
  const affiliations = await getAffiliations(env);
  const affiliationIds = cleanAffiliationIds(form, affiliations);

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
  await replaceOrganizationAffiliations(env, organizationId, affiliationIds);

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

async function handleCreateAffiliation(request: Request, env: Env, user: User) {
  const form = await request.formData();
  const name = cleanText(form.get("name"), 160);
  const slug = slugify(name);
  if (!name || !slug) {
    throw new HttpError(400, "Affiliation name required", "Enter a coalition, consortium, or convening name.");
  }

  const affiliationId = `affiliation:${slug}`;
  try {
    await env.DB.prepare(
      "INSERT INTO affiliations (id, name, slug) VALUES (?, ?, ?)"
    )
      .bind(affiliationId, name, slug)
      .run();
  } catch {
    throw new HttpError(400, "Affiliation already exists", "An affiliation with that name already exists.");
  }

  await writeAudit(env, user.id, "affiliation.created", "affiliation", affiliationId, { name, slug });
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
    <script defer src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.10/dist/htmx.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/csp@3.15.12/dist/cdn.min.js"></script>
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
      "content-security-policy": "default-src 'self'; img-src 'self' https: data:; script-src 'self' https://www.tiktok.com https://cdn.jsdelivr.net; frame-src https://www.tiktok.com https://*.tiktok.com; connect-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
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

function isHtmxRequest(request: Request) {
  return request.headers.get("HX-Request") === "true";
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

type TikTokEmbed = {
  sourceUrl: string;
  videoId: string;
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnailUrl: string;
};

async function fetchTikTokEmbed(sourceUrl: string): Promise<TikTokEmbed> {
  const normalized = normalizeTikTokVideoUrl(sourceUrl);
  if (!normalized) {
    throw new HttpError(400, "TikTok URL required", "Paste a valid TikTok video URL.");
  }

  const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(normalized)}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new HttpError(400, "TikTok video unavailable", "TikTok could not provide an embed for that video.");
  }

  const data = await response.json<{
    title?: unknown;
    author_name?: unknown;
    author_url?: unknown;
    thumbnail_url?: unknown;
    html?: unknown;
  }>();
  const htmlValue = typeof data.html === "string" ? data.html : "";
  const videoId = videoIdFromTikTokUrl(normalized) || htmlValue.match(/\bdata-video-id=["']([^"']+)["']/i)?.[1] || "";

  return {
    sourceUrl: normalized,
    videoId: videoId.slice(0, 80),
    title: typeof data.title === "string" ? data.title.slice(0, 500) : "",
    authorName: typeof data.author_name === "string" ? data.author_name.slice(0, 220) : "",
    authorUrl: typeof data.author_url === "string" ? data.author_url.slice(0, 500) : "",
    thumbnailUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url.slice(0, 1000) : "",
  };
}

function normalizeTikTokVideoUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    if (!["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"].includes(hostname)) {
      return "";
    }
    if (hostname === "tiktok.com" && !url.pathname.includes("/video/")) {
      return "";
    }
    url.protocol = "https:";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function videoIdFromTikTokUrl(value: string) {
  try {
    const url = new URL(value);
    return url.pathname.match(/\/video\/(\d+)/)?.[1] || "";
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

type PendingVideo = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  organization_id: string | null;
  organization_name: string | null;
  organization_slug: string | null;
  organization_logo_object_key: string | null;
  source_url: string;
  video_title: string | null;
  author_name: string | null;
  author_url: string | null;
  thumbnail_url: string | null;
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

async function getPendingVideos(env: Env, user: User, organizationId?: string) {
  const selectSql = `SELECT p.id, p.title, p.body, p.created_at, p.organization_id,
      o.name AS organization_name, o.slug AS organization_slug, o.logo_object_key AS organization_logo_object_key,
      v.source_url, v.title AS video_title, v.author_name, v.author_url, v.thumbnail_url
     FROM posts p
     JOIN video_embeds v ON v.post_id = p.id
     LEFT JOIN organizations o ON o.id = p.organization_id
     WHERE p.section = 'update' AND p.status = 'draft'`;
  const orderSql = " ORDER BY p.created_at DESC LIMIT 25";

  if (user.site_role === "site_admin") {
    const query = organizationId ? `${selectSql} AND p.organization_id = ?${orderSql}` : `${selectSql}${orderSql}`;
    const statement = env.DB.prepare(query);
    const pending = organizationId ? await statement.bind(organizationId).all<PendingVideo>() : await statement.all<PendingVideo>();
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
    ? await statement.bind(user.id, organizationId).all<PendingVideo>()
    : await statement.bind(user.id).all<PendingVideo>();
  return pending.results ?? [];
}

function renderPendingVideoReview(videos: PendingVideo[], returnTo: string) {
  const safeReturnTo = sanitizeReviewReturnPath(returnTo);
  const items = videos.length
    ? videos
        .map((video) => String.raw`
          <li class="${video.thumbnail_url ? "with-image" : ""}">
            ${video.thumbnail_url ? `<img class="list-thumb" src="${escapeHtml(video.thumbnail_url)}" alt="" loading="lazy" />` : ""}
            <div class="list-copy">
              <strong>${escapeHtml(video.title)}</strong>
              <p>${escapeHtml(excerpt(video.body, 260))}</p>
              <div class="meta">
                ${video.organization_name ? renderOrganizationPill(video.organization_name, video.organization_logo_object_key) : `<span class="badge">Ecosystem-wide</span>`}
                <span class="badge">TikTok video</span>
                <span class="badge">${escapeHtml(formatDate(video.created_at))}</span>
                ${video.author_name ? `<span class="badge">${escapeHtml(video.author_name)}</span>` : ""}
              </div>
              ${video.video_title ? `<p class="muted">${escapeHtml(excerpt(video.video_title, 180))}</p>` : ""}
              <div class="review-actions">
                <form method="post" action="/posts/${escapeHtml(video.id)}/approve">
                  <input type="hidden" name="return_to" value="${escapeHtml(safeReturnTo)}" />
                  <button class="primary" type="submit">Approve</button>
                </form>
                <form method="post" action="/posts/${escapeHtml(video.id)}/reject">
                  <input type="hidden" name="return_to" value="${escapeHtml(safeReturnTo)}" />
                  <button class="danger" type="submit">Reject</button>
                </form>
                <a class="button secondary" href="${escapeHtml(video.source_url)}">Source</a>
              </div>
            </div>
          </li>
        `)
        .join("")
    : `<li><strong>No pending videos</strong><br /><span class="muted">TikTok updates submitted by members will appear here for review.</span></li>`;

  return String.raw`
    <section class="panel">
      <div class="panel-head">
        <h2>Pending video review</h2>
        <span class="badge">${videos.length} pending</span>
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

async function getModeratablePost(env: Env, postId: string, expectedStatus: string) {
  const post = await env.DB.prepare(
    `SELECT p.id, p.section, p.organization_id, p.status, o.slug AS organization_slug,
      CASE WHEN v.post_id IS NOT NULL THEN 1 ELSE 0 END AS has_video
     FROM posts p
     LEFT JOIN organizations o ON o.id = p.organization_id
     LEFT JOIN video_embeds v ON v.post_id = p.id
     WHERE p.id = ? AND p.status = ? AND (
       p.section = 'event'
       OR (p.section = 'update' AND v.post_id IS NOT NULL)
     )`
  )
    .bind(postId, expectedStatus)
    .first<{ id: string; section: string; organization_id: string | null; status: string; organization_slug: string | null; has_video: number }>();
  if (!post) {
    throw new HttpError(404, "Review item not found", "That post is not waiting for review.");
  }
  return post;
}

async function requireCanManagePostReview(
  env: Env,
  user: User,
  post: { section: string; organization_id: string | null; has_video?: number }
) {
  if (post.section === "event") {
    await requireCanManageEvent(env, user, post.organization_id);
    return;
  }
  if (post.section === "update" && post.has_video) {
    await requireCanManageEvent(env, user, post.organization_id);
    return;
  }
  throw new HttpError(403, "Review access required", "Only site admins and organization admins can review this post.");
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
