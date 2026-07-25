# Optima Website V20.15 — Final GitHub Upload

This package is the website-only GitHub Pages release.

## What was corrected

- Every form now uses one production Apps Script endpoint.
- The form script has a completely new filename:
  `js/optima-backend-v20-15.js`
- The filename change bypasses old browser, GitHub Pages and CDN caches.
- Contact, consultation, vacancy and candidate forms all load the same script.
- Candidate registration now collects separate first and last names.
- Every submission records `clientVersion: 20.15.0` and identifies the website version in the Source field.
- The backend target is the production deployment connected to v1.9 and Resend.

## Upload

Upload the complete contents of this folder to the root of the existing GitHub Pages repository.

Use **Add file → Upload files**, select all files and folders, and commit directly to the main branch.

The old `js/forms-backend.js` file is no longer used. You may delete that old file from the repository after uploading this release.

## Verify

1. Wait for the GitHub Pages deployment to complete.
2. Open the live site in a private window.
3. Submit a candidate test with a new email address.
4. Check:
   - Candidates sheet
   - Activity Log
   - Error Log
   - Resend → Emails
5. The Source field should include `Optima website v20.15.0`.

No Apps Script code change is required for this GitHub release.
