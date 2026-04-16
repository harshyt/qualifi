# Skipped Features from Design

These features appear in the design mockups but were skipped during the initial implementation. They can be added as separate features in the future.

---

## Dashboard (`designs/dashboard.png`)

### Search Candidates
- **Design shows:** A "Search candidates..." input in the top header bar.
- **Why skipped:** No backend search/filter logic exists. Requires debounced client-side or server-side search across candidate name, role, and email.
- **Future work:** Add a search input in the dashboard header that filters the candidate list client-side (or via a Supabase query).

### All Roles Filter Dropdown
- **Design shows:** An "All Roles" dropdown filter next to the status pills (All/Shortlist/Pending/Reject).
- **Why skipped:** No role-based filtering is implemented in the current app.
- **Future work:** Add a role dropdown that filters the candidate table by job role/position.

### Pagination
- **Design shows:** Paginated table footer ("Showing 1–6 of 1,284 candidates" with page numbers).
- **Why skipped:** The app currently fetches all candidates at once without pagination.
- **Future work:** Implement server-side pagination with Supabase range queries, or client-side pagination for large datasets.

### Notification Bell
- **Design shows:** A bell icon in the top header bar.
- **Why skipped:** No notification system exists in the app.
- **Future work:** Implement a notification system (e.g., new candidate analyzed, status changed).

### Settings Icon
- **Design shows:** A gear/settings icon in the top header bar.
- **Why skipped:** No settings page exists.
- **Future work:** Add a settings page (user preferences, team settings, etc.).

---

## Candidate Detail Page (`designs/candidate_page.png`)

### Candidate Profile Photo
- **Design shows:** A real profile photo in the candidate header.
- **Implementation note:** Replaced with an initials-based `<Avatar>` (colored circle with 2-letter initials). This is already implemented in Phase 3.
- **Future work:** If resumes or a candidate intake form ever provide a profile photo URL, swap the initials avatar with an `<img>` fallback that still shows initials when no photo is available.

### Phone Number
- **Design shows:** Phone number in the candidate header (e.g., `+1 (000) 012-3456`).
- **Why skipped:** Phone is not extracted from resumes or stored in the database.
- **Future work:** Add phone extraction to the Gemini AI analysis prompt and store in the `candidates` table.

### Location / City
- **Design shows:** Location in the candidate header (e.g., "San Francisco, CA").
- **Why skipped:** Location is not extracted from resumes or stored in the database.
- **Future work:** Add location extraction to the Gemini AI analysis prompt and store in the `candidates` table.

### Send Email Button in Candidate Header
- **Design shows:** A "Send Email" button in the candidate header area.
- **Why skipped:** Email compose is accessible via the dashboard table's context menu (per-row action).
- **Future work:** Add a "Send Email" shortcut button directly on the candidate detail page header.

---

## Upload Resume Modal (`designs/upload_resume_modal.png`)

### File Size Display
- **Design shows:** File size next to each selected file (e.g., "245 KB").
- **Why skipped:** Minor — the `File` object has a `.size` property; just needs formatting.
- **Future work:** Display formatted file size (`(file.size / 1024).toFixed(0) + ' KB'`) next to each file name in the modal.
