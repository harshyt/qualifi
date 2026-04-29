~~Update Dashboard and move the current dashboard details to new candidates route and not dashboard~~
~~Use MUI dashboard layout and use throughout~~

- Add feature flags
- Fetch directly from one drive instead manual upload
- also instead of loading while uploading add a progress indicator for feedback
- Add proper app settings in top menu bar which show logout change theme user etc options
- If bulk upload show option to visit candidate for the resumes which are screened while other resumes will be parsed in background
- Add retry on candidate
- use axios interceptor and protect every route
- create a common loading component
- use error boundaries and centralised error handling
- Move common components like grid into a new reusable component
- Make filters drawer resuable, should accept props and render filters accordingly for grid
- Filter must handle multiselect, string, numbers, etc
- Create a reusable global search component which can be used through out app
- Add pagination to the grid component
- Add uploads in background and notify when uploaded
- Add a reddit like thread section where user can tags others directly and start a conversation
- Add resume in the candidate page to be downloaded
- If same resume uploads again, show a feedback that candidate has already screened click here check details (use combination of name, phone, email and companies for unique check, if all present then dont allow upload)
- Add ask fro review from dev button which can tags a dev and dev will receive the notificatuon
- Redesign Login page
- Update claude.md to always use above things before building a component or feature


