# Architecture

## Recommendation

Use Astro as the full-stack application framework and deploy it to Cloudflare Workers with `@astrojs/cloudflare`. The current Astro Cloudflare adapter supports on-demand rendered routes, server islands, actions, and sessions on Cloudflare Workers. A member community site needs dynamic rendering and authenticated server actions, so Workers are the better primary target than a purely static build.

## Runtime

```text
Browser
  -> Cloudflare Worker running Astro SSR
      -> D1 for relational data
      -> R2 for private files
      -> optional email provider for invites and magic links
```

## Data Ownership

The system has three main identity concepts:

- **User**: a person who can sign in.
- **Organization**: a member organization in the ecosystem.
- **Membership**: the user's role inside an organization.

A user can belong to multiple organizations. An organization can have multiple admins and contributors. Site admins can moderate across the whole platform.

## Content Model

Use one `posts` table for section-based publishing instead of separate tables for every content type. The `section` field can be:

- `legislation`
- `event`
- `project`
- `update`

Events and projects get companion detail tables only for fields that are specific to those workflows, such as event start time or project status. This keeps commenting, attachments, moderation, and permissions consistent.

## Storage

D1 should store:

- users and sessions
- organizations and memberships
- posts, comments, events, projects
- invitations and audit logs
- R2 object keys and attachment metadata

R2 should store:

- logos
- uploaded documents
- images
- shared files

R2 buckets should stay private. Files should be downloaded through an authenticated Worker endpoint that checks whether the signed-in user is allowed to access the related post, organization, event, or project.

## Search

Start with D1 search using indexed fields and simple filters by section, organization, tags, and dates. Add a search service later only if the content volume or full-text needs justify it.

## Deployment Shape

Recommended environments:

- `local`: Wrangler local D1/R2 state.
- `preview`: Cloudflare preview deployment with separate D1/R2 resources.
- `production`: production Worker, D1 database, and R2 bucket.

## Possible Later Additions

- Email notifications for comments, event changes, and project updates.
- Weekly digest emails.
- Moderation queue and report workflow.
- Calendar export for events.
- Public landing page with the private app behind authentication.
- Cloudflare Turnstile on invite request forms.
- Durable Objects only if real-time collaboration, chat, or live presence becomes important.

