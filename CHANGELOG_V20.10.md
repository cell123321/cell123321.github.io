# Optima Website V20.10 — Apps Script Response Fix

## Fixed

- Corrected the false “submission timed out” error.
- Apps Script HTML responses now send the acknowledgement to the top-level Optima website window.
- The website now accepts the acknowledgement from Google’s trusted Apps Script response origins.
- Response matching remains protected by a unique per-submission request ID.
- Increased the browser acknowledgement timeout from 60 to 90 seconds for document uploads.
- Backend version increased to 1.2.0.

## Important

The earlier timed-out submission may already have been stored in Google Sheets. Check the relevant sheet before resubmitting to avoid duplicate test records.
