# Site security and warning recovery

The Netlify build publishes only `dist`. The backend, function source, development
scripts, SQL, configuration secrets, and repository metadata are excluded. Unknown
URLs return a real 404. Netlify functions remain available through their API routes.

Account deletion requires an authenticated session and the current account password.
The server selects the account from the session, limits incorrect password attempts,
and revokes the session when deletion is scheduled. The settings page waits for a
successful server response. Password reset codes use secure randomness and allow at
most five incorrect submissions per code. Authentication responses are not cached,
and session cookies use `HttpOnly`, `Secure`, and `SameSite=Lax`.

Image uploads require an administrator session, accept only matching PNG, JPEG, or
WebP data up to 2 MB, and apply a persisted per-account upload allowance. Uploaded
images are stored on the site's Netlify Blobs storage and served as raster images
with `nosniff`, rather than forwarded to third-party upload services.

## Credentials previously exposed

`backend/.env` is no longer tracked, and database connections no longer use embedded
password defaults. Configure credentials locally using `backend/.env.example`, or
through the hosting provider's environment settings. Ignore files are not a vault.

Removing credentials in a new commit does **not** revoke passwords or remove their
old versions from Git history. The database owner must rotate any real passwords
previously committed, update their dependent applications, and revoke unused access.
Coordinate any history rewrite with all collaborators; do not force-push over their
work. The hosted Netlify storefront uses Blobs rather than this local PostgreSQL
configuration. Rotating PostgreSQL credentials is a separate database operation.

## Google Safe Browsing review

Google's warning is an external classification and cannot be cleared by JavaScript,
an HTTPS certificate, or a Git commit. After the corrected deployment is live:

1. Verify the production URL in Google Search Console using an authorized owner.
2. Open **Security issues**, inspect every reported issue and sample URL, and fix any
   flagged content or resource throughout the site.
3. Submit **Request review** with the actual fixes and deployment evidence. If Google
   has misclassified the site, its Safe Browsing error-report form is an alternative.
4. Check the public Safe Browsing status after Google completes its review. Do not
   claim the site is cleared while it is still marked unsafe.

References: [Security issues report](https://support.google.com/webmasters/answer/9044101),
[Safe Browsing status](https://transparencyreport.google.com/safe-browsing/search?url=https%3A%2F%2Ffashion-company.netlify.app),
[Report an incorrect classification](https://www.google.com/safebrowsing/report_error/).

## Verification

Run `npm run build`, `npm run test:catalog`, and `npm run test:security`. The existing
browser checks cover orders and campaigns; `npm run test:settings` checks that failed
deletions stay on the verification screen and successful requests clear the session.
Browser checks require Playwright, Chrome, a local test server from
`scripts/serve-local-flow.cjs`, and the `CATALOG_QA_OUTPUT` environment variable.
They use isolated test accounts and storage, never production customer accounts.
