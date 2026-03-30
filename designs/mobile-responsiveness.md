# Mobile Responsiveness Design & Implementation Plan

## Understanding Summary
- **What is being built**: A mobile-responsive version of the Qualifi AI Resume Screener.
- **Why it exists**: To allow recruiters to easily review and shortlist candidates on the go with a premium feel.
- **Who it is for**: Recruiters and hiring managers using the application on mobile devices.
- **Key Constraints**: 
  - Built with Next.js 14 (App Router) + MUI.
  - Must transition existing desktop-first layouts to be mobile-friendly without breaking the desktop experience.
- **Explicit Non-Goals**: No heavy swipe gestures or complex multi-step mobile wizards for now.

## Assumptions
- We will use MUI's `useMediaQuery` hook alongside theme breakpoints (sm, md) to detect screen sizes and adjust layouts.
- A new `Header` component for mobile navigation will be introduced, visible only on smaller screens.
- MUI's `Drawer` will handle switching from `permanent` on desktop to `temporary` on mobile.

## Decision Log
| Decision | Alternative Considered | Rationale |
| :--- | :--- | :--- |
| **Inline Action Buttons** | Sticky Bottom Bar, Swipe Gestures | User preferred standard inline buttons (Option B) to keep the focus on reading candidate analysis before deciding. |
| **Responsive Sidebar Drawer** | Bottom Navigation Bar | Recommended Option 1. Familiar navigation pattern that requires less restructuring of the existing dashboard and allows more room for future menu items. |
| **Vertical Stacking for Details** | Horizontal scroll snapping | The split-screen candidate view inherently needs vertical stacking on narrow viewports to allow natural scrolling and readable text. |

## Final Design Specifications

### 1. Navigation (Sidebar & Header)
- **Component**: `src/components/Sidebar.tsx` (and potentially a new `Header.tsx` or modifying `DashboardLayout.tsx`).
- **Behavior**: 
  - On desktop (`md` and up): Sidebar remains permanent on the left.
  - On mobile (`sm` and down): A top app bar/header appears with a hamburger menu icon. The sidebar transforms into a temporary drawer that slides in from the left when toggled.

### 2. Dashboard Layout (`src/app/dashboard/page.tsx`)
- **Stat Cards**: Ensure MUI `Grid` items for stats take full width (`xs={12}`) on mobile, transitioning to `sm={6}` or `md={3}` on larger screens.
- **Tabs**: Update the `Tabs` component to use `variant="scrollable"` and `allowScrollButtonsMobile={true}` so they remain accessible without breaking layout on narrow screens.
- **Candidate Table**: Ensure the table container (`DashboardTable` component) has `overflowX: 'auto'` to allow horizontal scrolling on smaller screens.

### 3. Candidate Detail View (`src/components/CandidateDetail/CandidateView.tsx`)
- **Layout Stacking**: Remove fixed height constraints (`calc(100vh - 100px)`) and `overflow: hidden` on mobile. Stack the "Resume Details" and "AI Analysis" panels vertically (`Grid` with `xs={12}`).
- **Action Buttons**: Place "Shortlist" and "Reject" buttons inline, prominently positioned.
- **Score Chip**: Ensure the match score stands out clearly on mobile screens.
