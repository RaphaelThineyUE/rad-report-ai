# Manual QA Checklist - RadReport AI

## Test Environment Setup
- [ ] Verify all dependencies are installed: `npm install` in both frontend and backend
- [ ] Set up .env files with required credentials
- [ ] Database is seeded with test data
- [ ] Supabase project is configured and RLS is enabled

## Authentication & Security
- [ ] User can register with valid email and password
- [ ] User cannot register with invalid email format
- [ ] User cannot register with weak password (< 8 characters)
- [ ] User can login with correct credentials
- [ ] User receives error with incorrect credentials
- [ ] User can request password reset
- [ ] User can reset password with valid token
- [ ] Protected routes redirect to login when not authenticated
- [ ] User dropdown shows current user information
- [ ] Logout button successfully signs out user
- [ ] Session persists on page refresh
- [ ] Audit logs record user actions (login, patient view, upload, delete)

## Patient Management
- [ ] User can create a new patient
- [ ] All required patient fields are validated
- [ ] User can view patient list
- [ ] User can search patients by name or ID
- [ ] User can click on patient to view details
- [ ] Patient detail page displays all patient information
- [ ] User can edit patient information
- [ ] User can delete a patient
- [ ] Deleted patient is removed from list
- [ ] User cannot view/edit/delete other users' patients (RLS enforced)

## Report Upload & Processing
- [ ] User can upload a single PDF report
- [ ] User can batch upload multiple PDFs
- [ ] Upload validates file type (PDF only)
- [ ] Upload shows progress bar during upload
- [ ] Upload handles duplicates gracefully
- [ ] Failed uploads show error message
- [ ] User can retry failed uploads
- [ ] Report processing starts automatically after upload
- [ ] Report status changes from "pending" → "processing" → "completed"
- [ ] Failed reports show error metadata and retry option
- [ ] Report data is extracted and stored correctly

## Report Analysis & AI Features
- [ ] Report detail page displays extracted information
- [ ] BI-RADS score is correctly displayed and highlighted
- [ ] Breast density is correctly displayed
- [ ] Red flags are highlighted prominently
- [ ] AI-generated summary is displayed in plain language
- [ ] Source quotes link back to original PDF sections
- [ ] Clinical review notices appear when appropriate

## Treatment Management
- [ ] User can add treatment records to a patient
- [ ] Treatment form validates required fields
- [ ] User can view all treatments for a patient
- [ ] User can edit treatment records
- [ ] User can delete treatment records
- [ ] Follow-up dates are properly tracked
- [ ] Treatment comparison feature shows treatment options
- [ ] AI comparison includes benefits, risks, and recommendations

## Patient Timeline & Consolidation
- [ ] Patient timeline displays all reports chronologically
- [ ] Timeline shows treatment records in chronological order
- [ ] Timeline uses color coding appropriately
- [ ] Consolidated view modal opens from patient detail
- [ ] Consolidated view shows aggregate statistics
- [ ] Consolidated view displays AI analysis across reports
- [ ] BI-RADS trend is detected correctly (improving/worsening/stable)
- [ ] Export consolidated data to JSON works

## Analytics & Dashboard
- [ ] Home page displays stat cards (patients, reports, red flags, pending)
- [ ] Home page shows patient selector dropdown
- [ ] Analytics page loads without errors
- [ ] Demographics charts display correctly
- [ ] Diagnostic charts display correctly
- [ ] Treatment charts display correctly
- [ ] Charts are responsive on mobile
- [ ] CSV export includes all relevant data

## UI/UX & Responsiveness
- [ ] App layout displays correctly on desktop
- [ ] Navigation is sticky and accessible
- [ ] Sidebar collapses on tablet/mobile
- [ ] All pages are responsive at 375px width (mobile)
- [ ] All pages are responsive at 768px width (tablet)
- [ ] Tables and lists are scrollable on small screens
- [ ] File dropzone works on mobile (tap to upload)
- [ ] Slide-over panels work on mobile (full-width)
- [ ] All buttons and links are accessible
- [ ] Keyboard navigation works throughout app
- [ ] Dark mode toggle works and persists
- [ ] Animations are smooth and not distracting

## Compliance & Safety
- [ ] No PHI appears in console logs
- [ ] No sensitive data in error messages
- [ ] Medical disclaimers appear where required
- [ ] HIPAA security notice appears on login page
- [ ] Rate limiting is applied to auth endpoints
- [ ] Input validation occurs on all forms
- [ ] All routes require authentication
- [ ] RLS policies enforce data isolation

## Performance
- [ ] Page load time < 3 seconds on standard connection
- [ ] Chart rendering is smooth (no lag)
- [ ] List pagination or virtualization works for large datasets
- [ ] PDF upload completes within reasonable time
- [ ] Report processing completes without timeouts
- [ ] Batch uploads process sequentially without overwhelming server

## Error Handling
- [ ] Validation errors display clear messages
- [ ] Network errors show user-friendly messages
- [ ] File upload errors are specific and actionable
- [ ] Processing failures include error details
- [ ] Missing required fields prevent form submission
- [ ] Expired sessions redirect to login

## Browser Compatibility
- [ ] App works on Chrome/Edge (latest)
- [ ] App works on Firefox (latest)
- [ ] App works on Safari (latest)
- [ ] App works on mobile Safari
- [ ] App works on Chrome Mobile
- [ ] Console shows no errors in any browser

## Accessibility
- [ ] All form inputs have associated labels
- [ ] Color contrast meets WCAG AA standards
- [ ] Tab order is logical throughout app
- [ ] Screen readers can navigate the app
- [ ] Alt text present on all images
- [ ] Focus states are visible
- [ ] Modal dialogs trap focus properly
