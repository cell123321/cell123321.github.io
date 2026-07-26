# Optima Website V20.19 — QA Report

## Root cause corrected

V20.18 submitted through a hidden iframe and then blocked the page while waiting
for a second cross-domain receipt check. Google Apps Script ContentService
redirects responses to `script.googleusercontent.com`; in the live browser that
confirmation path did not complete reliably, producing the 90-second timeout.

V20.19 removes the blocking receipt workflow. It uses a direct `fetch` POST with:

- `mode: no-cors`
- `credentials: omit`
- `Content-Type: text/plain;charset=UTF-8`
- JSON request body

The v1.9 Apps Script backend already accepts text/plain JSON in `parseRequest_()`
and processes it through `doPost()`.

## Static checks

- All four form pages contain exactly one V20.19 handler.
- The handlers are identical.
- No `pendingSubmissions`, `pollReceipt`, hidden iframe or 90-second timeout code remains.
- Every form uses the production Apps Script endpoint.
- Candidate and vacancy file payload field names match backend v1.9.
- Embedded JavaScript passed Node syntax validation.

## Chromium simulations

The actual page markup and embedded V20.19 handler were executed in Chromium.
`fetch` was instrumented to capture the exact outbound request.

Passed:

1. Contact form
2. Consultation form
3. Candidate form without CV
4. Candidate form with PDF CV
5. Vacancy form without attachment
6. Vacancy form with DOCX attachment

For every test:

- one POST request was generated;
- the URL matched the production Apps Script endpoint;
- the method was POST;
- mode was no-cors;
- credentials were omitted;
- the body was valid JSON;
- `clientVersion` was `20.19.0`;
- required backend fields were present;
- the page changed from Submitting to a success message;
- no page or console errors occurred.

File tests confirmed Base64 data and filenames were included under:

- `cvBase64`, `cvName`, `cvType`
- `jobDescriptionBase64`, `jobDescriptionName`, `jobDescriptionType`

## Honest limitation

The test environment cannot send a real production POST to Google. The transport
has been restored to the same no-cors text/plain method that previously reached
the spreadsheet, and the actual browser payload has been validated. The first
live Contact submission after deployment remains the final production check.
