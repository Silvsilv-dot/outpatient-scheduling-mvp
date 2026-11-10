# Batch 4 frontend patch

This ZIP contains a reviewed patch, not a standalone project. It requires an existing Vite + React frontend, Tailwind CSS setup, and a compatible backend. No package manifest, lockfile, backend, authentication, or CI configuration is included. Original source: supplied batch-4-code.pdf.

## Install
1. Extract the ZIP locally. Merge its frontend folder into the repository root, preserving paths. Review the existing App.jsx first: this replacement can remove existing routes/providers/features. Integrate the navigation into your existing App instead when necessary.
2. Merge the environment example into your existing frontend environment configuration. Do not overwrite other values. Set VITE_BACKEND_URL and a test VITE_DEMO_CLINICIAN_ID; restart the dev server after environment changes. VITE variables are public frontend configuration, never secrets.
3. Use the repository's existing package manager and scripts to run lint, tests, and a production build. No build or browser test was run when this archive was generated.
4. Review the changes on a feature branch and open a pull request. Upload the extracted files, not just the ZIP, if GitHub should contain usable source code.

Example commands from the repository root (adapt npm commands to your package manager):
```sh
git switch -c batch-4-dashboard
# Copy/merge extracted files now.
cd frontend
npm run build
# Run lint/test scripts if defined in package.json.
cd ..
git add frontend/src/components/StaffDashboard.jsx frontend/src/components/ClinicianView.jsx frontend/src/App.jsx frontend/.env.batch4.example BATCH4_README.md
git diff --cached
git commit -m "Add Batch 4 staff dashboard and clinician agenda"
git push -u origin batch-4-dashboard
```
Do not commit local .env files or patient data. Git commands assume these paths match your existing repository.

## Expected API contract
- GET /api/appointments -> JSON array of { id, patient_name, clinician_name, appointment_time, status }.
- PATCH /api/appointments/:id/status with JSON { status: "confirmed" | "cancelled" } -> successful HTTP status. Response body is not required.
- GET /api/clinicians/:clinicianId/schedule -> JSON array of { id, patient_name, appointment_time, reason, status }.
- Dates should include an explicit timezone offset or Z. Display uses the browser's local timezone, not a defined clinic timezone.
- Statuses assumed: scheduled, confirmed, cancelled. UI permits scheduled -> confirmed/cancelled and confirmed -> cancelled. Backend must independently validate allowed transitions and handle conflicting edits.
- If the API returns an envelope such as { appointments: [...] }, adapt the array extraction. Authentication headers/cross-origin cookie credentials must be integrated with your actual auth design; they are not included here.

## Changes from supplied PDF
- Removed PDF copy artifacts and reconstructed valid JSX source.
- Added visible clinician request errors, refresh/retry, array-response checks, and fetch cleanup on view changes.
- Prevented duplicate status submissions per row; restricted UI transitions and added cancellation confirmation.
- Added search/filter labels, feedback roles, safer missing-value rendering, and toast timer cleanup.
- Moved hardcoded clinician ID to explicit demo environment configuration.
- Displayed full clinician appointment dates and times; removed unsupported claims that returned data is only today's agenda or a check-in queue.

## Missing scope / release gates
- Rescheduling is described in the PDF but not implemented. It needs a date/time editor and backend validation for availability and conflicts.
- Daily/weekly navigation and a real check-in workflow are not implemented.
- View-switch buttons are not role-based access control. Authenticate users and enforce staff/clinician permissions on the server. Never trust a supplied clinician ID as authorization.
- Integrate with existing booking screens, authentication providers, and routing rather than replacing them accidentally.
- Verify API shape, access controls, timezone requirements, error states, and status transitions with the actual backend before release. Use synthetic test records.
- Confirm Vercel project root/build/output settings, API routing, production environment values, and any cross-origin settings in the existing deployment. This archive does not configure them or guarantee an automatic production deployment.

## Manual acceptance checklist
- Roster loads; search and status filter work together; empty and failure states are understandable.
- Confirm and cancel persist after refresh; cancellation dismissal sends no update; pending rows cannot be submitted twice.
- Failed updates show errors; successful updates followed by a failed refresh are distinguishable in feedback.
- Clinician selection/configuration, schedule refresh, empty response, request failure, and view switches behave as expected.
- Keyboard navigation and mobile table overflow are usable.
- Unauthorized requests and cross-clinician access are rejected by the backend.
- Existing features still work, and CI/build checks pass before merge.
