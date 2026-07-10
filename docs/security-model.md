# Security Model

## Membership Boundary

The site should be private by default. Unauthenticated visitors can only see a minimal sign-in or request-invite screen. All community content requires a valid session.

## Authentication

Recommended first version:

- Invite-only accounts.
- Email-based magic links or another passwordless provider.
- Secure, HTTP-only, same-site session cookies.
- Session records stored in D1 with expiration and revocation.

Cloudflare Access can still be useful for:

- protecting preview/staging environments
- adding an extra gate around admin-only routes
- limiting internal operational tools

It should not be the only authorization layer if the app needs organization-specific roles and posting permissions.

## Roles

Site roles:

- `site_admin`: manage all users, organizations, moderation, and settings.
- `member`: normal authenticated community member.

Organization roles:

- `org_admin`: edit organization profile, manage members, publish as the organization.
- `contributor`: create posts, events, and projects for the organization.
- `viewer`: read and comment as an approved member.

## Authorization Rules

- Only authenticated users can read member content.
- Only organization admins can edit their organization profile.
- Organization admins and contributors can publish on behalf of their organization.
- Users can edit their own comments within the product's edit window.
- Site admins can moderate or archive any content.
- R2 objects are never public by default.

## Baseline Protections

- Validate all form inputs on the server.
- Use prepared statements for all D1 queries.
- Add CSRF protection to state-changing form submissions.
- Rate-limit sign-in, invite, comment, and upload endpoints.
- Store only R2 object keys in D1, not public file URLs.
- Log security-relevant actions in `audit_log`.
- Keep deleted community content soft-deleted first, then hard-delete only through admin maintenance.

