# V20.11 — Public Apps Script endpoint fix

- Replaced the Google Workspace domain-scoped Apps Script endpoint (`/a/macros/optimasolutionsintl.com/...`) with the public deployed web-app endpoint (`/macros/s/.../exec`).
- This avoids the hidden form iframe being redirected into a Google Workspace sign-in/domain flow, which prevented `doPost` from running and left submissions on “Submitting…”.
- No Apps Script code change or new backend deployment is required when backend v1.2.0 is already live.
