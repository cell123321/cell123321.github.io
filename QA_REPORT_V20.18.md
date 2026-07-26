# Optima Website V20.18 — QA Report

## Release

- Website build: **V20.18.0**
- Backend target: **Optima Recruitment Backend v1.9.0**
- Production endpoint:
  `https://script.google.com/macros/s/AKfycbzF1thaAD1eG3YBwHFGqOl8fcgrvi_qHdfV3c6LGpmy32kiBegNg-yBzB1le_pz_mTA/exec`
- Confirmation email provider: **Resend**, configured in the Apps Script backend

## Defect corrected after V20.17

The vacancy salary builder produced values such as:

`EUR 65000 per Per year`

V20.18 now produces:

`EUR 65000 per year`

and:

`EUR 500 per day`

## Static package checks

- 16 HTML pages inspected.
- No missing local HTML, JavaScript, favicon or navigation targets.
- No duplicate HTML element IDs detected.
- Every HTML page contains the build marker `20.18.0`.
- No form page references the deleted files:
  - `js/forms-backend.js`
  - `js/optima-backend-v20-15.js`
- Candidate, contact, consultation and vacancy pages each contain exactly one form handler.
- The four embedded form handlers are byte-for-byte identical.
- Shared JavaScript files passed syntax validation:
  - `js/script.js`
  - `js/jobs.js`
  - `js/job-detail.js`
- The embedded form handler passed Node.js syntax validation.

## Browser-level form simulations

The actual V20.18 form markup and JavaScript were executed in Chromium with a simulated Apps Script response.

### Successful submissions

1. Contact form
   - Required fields collected.
   - Privacy consent transmitted.
   - POST payload generated correctly.
   - Backend record confirmation displayed.

2. Consultation form
   - Name, organisation, email, telephone, service and preferred method mapped.
   - Requirements combined into the message field.
   - Backend confirmation displayed.

3. Candidate form without CV
   - Separate first and last names mapped correctly.
   - GDPR, candidate declaration and marketing consent mapped.
   - Backend confirmation displayed.

4. Candidate form with PDF CV
   - PDF converted to Base64.
   - `cvBase64`, `cvName` and `cvType` transmitted.
   - Backend confirmation displayed.

5. Vacancy form without attachment
   - Organisation, contact, vacancy and salary details mapped.
   - Authority and privacy confirmations transmitted.
   - Backend confirmation displayed.

6. Vacancy form with DOCX attachment
   - DOCX converted to Base64.
   - `jobDescriptionBase64`, `jobDescriptionName` and `jobDescriptionType` transmitted.
   - Specific start date transmitted.
   - Backend confirmation displayed.

### Failure and validation behaviour

- Missing required fields: browser blocked submission; no POST generated.
- Unsupported candidate file extension: clear error shown; no POST generated.
- File larger than 5 MB: clear error shown; no POST generated.
- Simulated backend rejection: backend message shown; button re-enabled.
- Successful completion: form reset and actual record reference shown.
- No browser console errors or uncaught JavaScript errors occurred during successful simulations.

## Payload compatibility with backend v1.9

The website sends the exact required backend properties:

- Contact: `name`, `email`, `message`, `gdprConsent`
- Consultation: `name`, `email`, `gdprConsent`
- Vacancy: `organisation`, `contactName`, `email`, `roleTitle`, `clientAuthority`, `gdprConsent`
- Candidate: `firstName`, `lastName`, `email`, `candidateConfirmation`, `gdprConsent`

File property names also match backend v1.9.

## Important limitation

The QA environment blocks live outbound browser navigation to Google Apps Script. Therefore, no real production row or Resend message was created during this pre-upload audit.

The package has passed static validation and full browser-level form simulation. The final production proof must be one test submission after GitHub Pages deploys V20.18.
