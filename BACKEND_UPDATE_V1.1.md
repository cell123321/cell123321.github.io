# Update the existing Apps Script deployment to v1.1

The spreadsheet and Drive folders already exist. Do not create a second Apps Script project.

1. Open the existing **Optima Recruitment Backend** Apps Script project.
2. Open `Code.gs` and replace all existing code with `google-apps-script/Code.gs` from this release.
3. Save the project.
4. Click **Deploy → Manage deployments**.
5. Select the active web-app deployment and click **Edit**.
6. In **Version**, choose **New version**.
7. Use the description `Optima Recruitment Backend v1.1` and click **Deploy**.
8. Keep the existing deployment URL. Updating the active deployment preserves that URL.
9. Open the `/exec` URL and confirm the response contains `"version":"1.1.0"`.

You do not need to run `setupOptimaBackend()` again. The updated code uses the spreadsheet and Drive folder IDs already stored in Script Properties.

## Test order

After uploading V20.9 to GitHub Pages, submit:

- one contact enquiry;
- one consultation request;
- one vacancy with a small test document;
- one candidate record with a small test CV.

Use names beginning with `TEST` so the rows and files are easy to remove afterward.
