# Optima Website V20.16 — Inline Backend Fix

This release removes the separate form JavaScript file. The complete submission code is embedded directly in each form page, so GitHub folder uploads, stale JavaScript files and browser caching cannot disable the forms.

## Upload

1. Extract this ZIP.
2. In the existing GitHub repository, upload all files and folders from inside the extracted folder.
3. Replace files when prompted and commit to `main`.
4. Delete these obsolete files from the repository if they still exist:
   - `js/forms-backend.js`
   - `js/optima-backend-v20-15.js`
5. Wait for the GitHub Pages deployment to complete.
6. Open the live site in a private window.

## Test

Submit the contact form first, then the candidate form without a CV, then with a small PDF.

A successful submission displays the actual backend record ID, such as `ENQ-000004` or `CAN-000004`. The form does not show success merely because a request was attempted; it waits for the Apps Script receipt.

No Apps Script change is required. The website targets the existing production `/exec` deployment.
