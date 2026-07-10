# NH Solidarity Ecosystem

Secure member-only community site for New Hampshire organizations to share legislation notes, events, projects, posts, and discussion.

## Recommended Stack

- **Astro SSR** for the web app and member-facing UI.
- **Cloudflare Workers** via the official Astro Cloudflare adapter for server-rendered pages, API endpoints, and auth checks.
- **Cloudflare D1** for relational application data: users, organizations, membership, posts, events, projects, comments, invitations, and audit logs.
- **Cloudflare R2** for private file storage: organization logos, profile media, post attachments, event documents, and project files.
- **Invite-only authentication** backed by D1 sessions, with optional Cloudflare Access in front of staging/admin routes.

This keeps the first version small and deployable while leaving room for richer permissions, moderation, search, and notifications later.

## Core Product Areas

- Organization profiles with logos, descriptions, links, contact info, and issue areas.
- Member profiles connected to one or more organizations.
- Sections for legislation, events, projects, and general updates.
- Posts and threaded comments across each section.
- Attachments stored privately in R2 and served only after authorization.
- Role-based permissions for site admins, organization admins, contributors, and members.
- Invitation and approval workflow so the community stays member-only.

## Initial Milestones

1. Build the Astro/Cloudflare app shell with auth-aware layout.
2. Create D1 schema and migrations.
3. Implement invite-only sign-in and session handling.
4. Add organization profiles and organization membership roles.
5. Add posts, comments, and section filters.
6. Add events and projects.
7. Add private R2 uploads.
8. Add moderation, audit logs, and admin tools.

## Design Notes

See:

- [Architecture](./docs/architecture.md)
- [Security Model](./docs/security-model.md)
- [Initial D1 Schema](./migrations/0001_initial.sql)

