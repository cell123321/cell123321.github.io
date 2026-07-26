# QA Report — Optima V20.20

## Endpoint audit

Expected endpoint:
`https://script.google.com/macros/s/AKfycbwew1asSJyU3zRPill38cweig1DTUvtnK1_eee-Zsqt-D3zvX7aN50YcmEMWYQV5X_1/exec`

Results:
- contact.html: one exact occurrence
- consultation.html: one exact occurrence
- candidates.html: one exact occurrence
- vacancies.html: one exact occurrence
- old endpoint occurrences across package: zero

## Form-handler audit

- Each form page contains exactly one `CLIENT_VERSION = '20.20.0'`.
- Each form page contains exactly one production endpoint.
- Each form page contains one fetch submission call.
- All form pages retain the direct `text/plain` POST transport used in V20.19.
- No form page references obsolete external form-backend JavaScript files.

## Syntax audit

The embedded form-handler JavaScript was extracted from each form page and checked with Node.js.

## Limitation

This environment cannot make a live outbound request to the Google Apps Script deployment. The package verifies the exact endpoint wiring and JavaScript syntax. The definitive production confirmation is a new `doPost` Web app execution after GitHub Pages deploys V20.20.
