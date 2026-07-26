# Upload Optima Website V20.18

## Before uploading

Keep the current GitHub commit available as a rollback point.

## Upload procedure

1. Extract `optima_github_v20_18_final_verified.zip`.
2. Open the existing GitHub Pages repository.
3. Upload every file and folder inside the extracted directory to the repository root.
4. Replace the current files.
5. Delete these obsolete files if they still exist:
   - `js/forms-backend.js`
   - `js/optima-backend-v20-15.js`
6. Commit directly to the branch used by GitHub Pages.
7. Open **Actions** and wait for the Pages deployment to finish successfully.

## Confirm the new build is live

Open the live site in a private browser window.

Open page source and search for:

`optima-build`

The page should contain:

`content="20.18.0"`

The browser console will also show:

`Optima form handler v20.18.0 initialised`

## Production test order

1. Submit the Contact form first.
2. Confirm an `ENQ-` record appears in the Enquiries sheet.
3. Confirm the page shows the same record ID.
4. Submit the Candidate form without a CV.
5. Confirm a `CAN-` record appears in Candidates.
6. Check Resend → Emails for the acknowledgement.
7. Test a small PDF CV.
8. Test the vacancy form last.

## Do not change Apps Script

This release targets the existing active Apps Script v1.9 deployment. No Apps Script code or deployment change is required for this website upload.
