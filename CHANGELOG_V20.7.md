# V20.7 Changelog

## Added
- Google Sheets and Google Drive backend package using Google Apps Script.
- Secure POST handling for Contact, Consultation, Vacancy and Candidate forms.
- Private Drive storage for CVs and vacancy documents.
- Separate spreadsheet tabs for each form type.
- Automatic email notifications.
- Required-field and email validation on both browser and backend.
- Five-megabyte document limit and restricted file extensions.
- Honeypot spam field.
- Submission progress, success and error messages.
- Setup and deployment guide.

## Fixed
- Forms no longer submit personal information using URL query parameters.
- Vacancy data is no longer exposed in the browser address bar.

## Activation required
The forms remain safely inactive until the Google Apps Script Web App URL is added to `js/forms-backend.js`. Follow `GOOGLE_BACKEND_SETUP.md`.
