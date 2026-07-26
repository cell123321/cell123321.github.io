# Optima Website V20.19 — Reliable Submission Transport

## Why V20.18 timed out

V20.18 waited for a second cross-domain receipt check from Google Apps Script.
The browser could not reliably read that confirmation, so the page waited for
90 seconds and then displayed an error.

V20.19 removes that blocking receipt mechanism. It uses the same direct
`no-cors` `text/plain` POST method that previously reached Google Sheets
successfully. The Apps Script v1.9 backend accepts this JSON format.

## Upload

1. Extract the ZIP.
2. Upload every file and folder to the root of the current GitHub Pages repository.
3. Replace existing files.
4. Commit to the GitHub Pages branch.
5. Wait for the Pages deployment to complete.
6. Open the live website in a private window.

## Verify the build

View page source and search for `optima-build`. It must show `20.19.0`.
The browser console will show `Optima form handler v20.19.0 initialised`.

## Test

Submit Contact first. The page should stop submitting as soon as Google accepts
the network request and show a `WEB-...` reference. Then check the Enquiries
sheet. Candidate acknowledgements continue to be sent through Resend by the
Apps Script v1.9 backend.

No Apps Script change is required.
