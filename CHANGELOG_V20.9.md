# Optima Website V20.9 — Live Google Workspace Backend

## Completed

- Connected all four live forms to the deployed Google Apps Script endpoint.
- Added verified cross-origin submission using a hidden iframe and `postMessage` response.
- Added form-specific field mapping for contact, consultation, vacancy and candidate records.
- Added private CV and job-description upload support up to 5 MB.
- Added PDF, DOC, DOCX, PPT and PPTX validation.
- Added loading, success, error and reference-number messages.
- Added duplicate-submit prevention while a request is running.
- Added vacancy brief and candidate objectives to spreadsheet Notes fields.
- Added GDPR and optional future-opportunity consent capture.
- Added backend v1.1 source with reliable iframe responses and extended file handling.

## Release order

1. Update the existing Apps Script deployment to backend v1.1.
2. Confirm the `/exec` endpoint reports version `1.1.0`.
3. Upload the website files to the GitHub Pages repository.
4. Test each form with clearly labelled test records.
