# Job Drawer Mobile Responsiveness Design

## 1. Understanding Summary
- **What is being built:** A full-screen mobile layout for the job-related Drawers (Add Job, View Job, and History).
- **Why it exists:** The previous implementation caused confusing double-scrollbars and nested scrolling issues on mobile. Action buttons (Save/Cancel/Close) were pushed off-screen, making interactions difficult.
- **Who it is for:** Mobile users accessing the job dashboard.
- **Key constraints:** On the `xs` breakpoint (phones), the drawer must take up 100% of the screen width and height. Action buttons must be permanently pinned to the bottom of the screen. Only the middle content (the form fields or details body) will scroll.
- **Explicit non-goals:** Altering behavior or layout for desktop/tablet users (`sm` breakpoints and up). Moving these flows to entirely new Next.js routes/pages.

## 2. Assumptions
- **Performance & Maintenance:** We assume standard reliable Flexbox (`display: flex`, `flexDirection: column`, `flexGrow`, `overflowY`) is sufficient to pin headers, bodies, and footers predictably across modern mobile browsers (iOS Safari, Android Chrome).
- **Component Isolation:** The `AddJobForm` component contains its action buttons internally and will need its internal structure updated to support a pinned footer (using `flexGrow: 1` correctly in its wrapping container).

## 3. Decision Log
**Decision 1: Full-Screen Drawer Width and Height**
- *What was decided:* Set the Drawer's `PaperProps` to `width: { xs: "100vw", sm: 500 }` and `height: { xs: "100vh", sm: "100%" }` using standard responsive objects. The drawer `anchor` remains "right".
- *Alternatives considered:* Changing the anchor to "bottom" with rounded corners.
- *Why this option was chosen:* Using bottom anchors and percentages like `90vh` created nested scrolling edge cases with virtual keyboards. A strict full-width, full-height sliding drawer acts like a native app page and simplifies scroll management significantly.

**Decision 2: Strict Flexbox Layout over Fixed Positioning**
- *What was decided:* We will use `flexGrow: 1, overflowY: 'auto'` on the main form content, and `flexShrink: 0` on the header and footer inside a main `flexDirection: 'column'` container.
- *Alternatives considered:* Setting `position: fixed; bottom: 0;` on the action buttons.
- *Why this option was chosen:* Fixed and sticky positioning behave notoriously badly inside transformed or translated containers (such as the MUI Drawer animation sliding from the right) on mobile iOS Safari. Flexbox guarantees safe, constrained space calculation.

## 4. Final Design Implementation Details
1. **Drawer Container (`src/app/jobs/page.tsx`):**
   - Use `PaperProps`: `sx: { width: { xs: '100vw', sm: 500 }, height: '100vh', display: 'flex', flexDirection: 'column', p: 0 }` (Padding removed from the wrapper so regions can go full width).
   - Re-introduce padding into the individual Header, Body, and Footer regions.
2. **Body & Form:**
   - Any container that wraps standard content inside the drawer gets `sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, sm: 3 } }}`.
3. **Footer & Action Buttons:**
   - Move Save/Cancel/action buttons into a bottom container with `sx={{ flexShrink: 0, p: { xs: 2, sm: 3 }, borderTop: '1px solid #E0E0E0', bgcolor: 'white' }}`.
