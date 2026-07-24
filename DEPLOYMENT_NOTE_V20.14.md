# Optima V20.14 deployment

This release fixes the form interface remaining on “Confirming receipt” after Google Sheets has already recorded the submission.

## Required action

Upload all files in this package to the existing GitHub Pages repository, replacing the current website files.

No Google Apps Script change or redeployment is required. Keep the existing working backend deployment.

After GitHub Pages finishes deploying, use Ctrl+F5 on the live website.

## Behaviour

The website now shows a success message as soon as Google accepts the secure POST request. A traceable WEB reference is shown to the user and is stored in the Source field of the corresponding Google Sheet row.
