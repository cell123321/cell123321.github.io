# Optima Website V20.20 — Correct Apps Script Endpoint

## Root cause corrected

The website was sending forms to the wrong Apps Script deployment:

OLD:
`https://script.google.com/macros/s/AKfycbzF1thaAD1eG3YBwHFGqOl8fcgrvi_qHdfV3c6LGpmy32kiBegNg-yBzB1le_pz_mTA/exec`

The active Apps Script deployment supplied by the owner is:

NEW:
`https://script.google.com/macros/s/AKfycbwew1asSJyU3zRPill38cweig1DTUvtnK1_eee-Zsqt-D3zvX7aN50YcmEMWYQV5X_1/exec`

All four forms now use the NEW deployment:

- Contact
- Consultation
- Candidate
- Vacancy

## Upload

1. Extract this ZIP.
2. Upload every extracted file and folder to the root of the existing GitHub Pages repository.
3. Replace the current files.
4. Commit to the branch used by GitHub Pages.
5. Wait for the Pages deployment to complete.

## Confirm V20.20 is live

Open the live page source and search for:

`optima-build`

It must show:

`content="20.20.0"`

On a form page, search the source for:

`AKfycbwew1asSJyU3zRPill38cweig1DTUvtnK1_eee-Zsqt-D3zvX7aN50YcmEMWYQV5X_1`

The OLD deployment ID must not appear.

## Production test

1. Submit the Contact form first.
2. Check Apps Script > My Executions for a new `doPost` Web app execution.
3. Check the Enquiries sheet for a new ENQ record.
4. Test the Candidate form.
5. Check Resend > Emails for the acknowledgement.

No further GitHub or endpoint changes should be made unless the Apps Script deployment URL changes again.
