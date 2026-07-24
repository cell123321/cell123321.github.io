# Backend Update v1.2

1. In the existing Optima Recruitment Backend Apps Script project, replace all code in `Code.gs` with `google-apps-script/Code.gs` from this release.
2. Save the project. Do not run `setupOptimaBackend()` again.
3. Select Deploy > Manage deployments.
4. Edit the existing web-app deployment.
5. Select New version and use the description `Optima Recruitment Backend v1.2`.
6. Deploy. The existing `/exec` URL remains unchanged.
7. Open the `/exec` URL and confirm it reports version `1.2.0`.
8. Upload the V20.10 website files to the existing GitHub Pages repository.
