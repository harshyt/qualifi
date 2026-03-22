export type RoleKey =
  | "dotnet"
  | "react-nextjs"
  | "react-native"
  | "qa-playwright"
  | "manual-tester"
  | "generic";

export interface RoleConfig {
  persona: string;
  title: string;
  evaluationCriteria: string;
  scoringRubric: string;
}

export const ROLE_CONFIGS: Record<RoleKey, RoleConfig> = {
  dotnet: {
    persona: "Senior .NET Architect and Technical Hiring Lead",
    title: ".NET Developer",
    evaluationCriteria: `
- MUST-HAVE: C#, ASP.NET Core (or .NET Framework), REST APIs, Entity Framework or Dapper
- STRONG PLUS: Microservices, Azure, AWS or GCP, SQL Server, CQRS/MediatR, Clean Architecture
- ASSESS: Version of .NET used (modern .NET 6/7/8 vs legacy?), OOP depth, async/await usage
- CHECK: Did they build APIs from scratch or just maintain? Did they own architecture decisions?
- BONUS: Docker/Kubernetes, SignalR, gRPC, Blazor, background services (Hangfire/Quartz)
- RED FLAGS: Only Windows Forms/WPF with no backend API work, no mention of unit testing, stuck on .NET Framework 4.x with no modern exposure`,
    scoringRubric: `
- 90-100: Hands-on C#/.NET Core expert, microservices, cloud, CI/CD, strong testing culture
- 75-89: Solid .NET developer, REST APIs, ORM, some cloud or DevOps exposure
- 60-74: Decent .NET background but gaps in modern practices or architecture
- 45-59: Basic .NET exposure, primarily maintenance work, limited API ownership
- 0-44: Insufficient .NET experience or major skill mismatch`,
  },

  "react-nextjs": {
    persona: "Senior Frontend Engineer and React Ecosystem Expert",
    title: "React / Next.js Developer",
    evaluationCriteria: `
- MUST-HAVE: React (hooks, context, functional components), Next.js (App Router or Pages Router), TypeScript, REST or GraphQL API integration
- STRONG PLUS: Server Components, SSR/SSG/ISR understanding, Tailwind CSS, state management (Zustand/Redux/Jotai), React Query or SWR
- ASSESS: Do they understand rendering strategies (CSR vs SSR vs SSG)? Have they optimized performance (lazy loading, code splitting, Core Web Vitals)?
- CHECK: Did they build full features end-to-end or just UI components? Any design system or component library work?
- BONUS: Testing (Jest, React Testing Library, Cypress), CI/CD, Storybook, accessibility (a11y), Vercel/deployment experience
- RED FLAGS: Only class components, no TypeScript, no understanding of SSR, purely copy-paste from tutorials`,
    scoringRubric: `
- 90–100: Next.js App Router, TypeScript, performance optimization, testing, CI/CD — production-grade experience
- 75–89: Solid React/Next.js with TypeScript, state management, API integration, some testing
- 60–74: React experience but limited Next.js, weak TypeScript, minimal testing
- 45–59: Basic React, no Next.js or SSR understanding, JavaScript only
- 0–44: Insufficient frontend/React experience`,
  },

  "react-native": {
    persona:
      "Senior Mobile Engineer specializing in React Native and cross-platform development",
    title: "React Native Developer",
    evaluationCriteria: `
- MUST-HAVE: React Native (Expo or bare workflow), React hooks, JavaScript/TypeScript, REST API integration, mobile deployment (App Store / Play Store)
- STRONG PLUS: React Navigation, Redux or Zustand, push notifications, deep linking, native modules (bridging), performance optimization (FlatList, memoization)
- ASSESS: Have they shipped apps to production stores? Do they understand mobile-specific concerns (battery, offline, permissions, different OS versions)?
- CHECK: Expo managed vs bare — can they handle native code when needed? Any Objective-C/Swift or Kotlin/Java exposure?
- BONUS: Reanimated 2/3, Skia, testing (Jest, Detox), CI/CD (Fastlane, EAS Build), in-app purchases, analytics integration
- RED FLAGS: Only React web experience with no mobile, never shipped to stores, no understanding of mobile UX patterns`,
    scoringRubric: `
- 90–100: Shipped production apps, native modules, performance tuning, CI/CD, TypeScript
- 75–89: Solid RN developer, store deployments, navigation, state management, some native exposure
- 60–74: Decent RN experience but limited native work or no store deployments
- 45–59: Basic RN, Expo-only, minimal production experience
- 0–44: Primarily web React, insufficient mobile experience`,
  },

  "qa-playwright": {
    persona:
      "Senior QA Engineer and Automation Architect with deep Playwright expertise",
    title: "QA / Automation Engineer (Playwright)",
    evaluationCriteria: `
- MUST-HAVE: Playwright (TypeScript or JavaScript), test design (e2e, functional), Page Object Model or similar pattern, CI/CD integration (GitHub Actions, Jenkins, etc.)
- STRONG PLUS: API testing (Playwright or Postman/REST Assured), parallel test execution, flaky test debugging, reporting (Allure, Playwright HTML reporter)
- ASSESS: Do they write maintainable test suites or just scripts? Do they understand the testing pyramid? Any experience with test strategy/planning?
- CHECK: Have they worked with cross-browser testing? Dynamic content handling, auth flows, file uploads, network interception?
- BONUS: Visual regression testing, accessibility testing, performance testing, Docker-based test environments, TypeScript proficiency
- RED FLAGS: Only manual testing with superficial automation exposure, tests that don't scale, no CI/CD integration, Selenium background with no Playwright specifics`,
    scoringRubric: `
- 90–100: Playwright expert, scalable POM frameworks, CI/CD, API testing, flaky test management, TypeScript
- 75–89: Strong Playwright automation, CI integration, good test design, some API testing
- 60–74: Working Playwright knowledge but limited framework design or CI experience
- 45–59: Basic automation, Selenium-heavy, limited Playwright, minimal CI
- 0–44: Primarily manual tester with minimal automation depth`,
  },

  "manual-tester": {
    persona:
      "Senior QA Lead with expertise in manual testing methodologies and software quality",
    title: "Manual Tester / QA Analyst",
    evaluationCriteria: `
- MUST-HAVE: Test case design, test plan documentation, bug reporting (Jira or equivalent), regression testing, cross-browser/cross-device testing
- STRONG PLUS: API testing (Postman), SQL for data validation, Agile/Scrum experience, exploratory testing, UAT coordination
- ASSESS: Quality and depth of their testing process — do they go beyond happy paths? Have they caught critical bugs? Any metrics or outcomes mentioned?
- CHECK: Have they worked on complex domains (fintech, healthcare, e-commerce)? Do they write clear, reproducible bug reports?
- BONUS: Basic automation knowledge, test management tools (TestRail, Zephyr), mobile testing, accessibility testing, performance observation
- RED FLAGS: Vague testing descriptions ("tested features"), no bug tracking tool mentioned, no understanding of test lifecycle, no evidence of structured test documentation`,
    scoringRubric: `
- 90–100: Structured test plans, deep domain expertise, API + SQL validation, Agile, strong bug reporting track record
- 75–89: Solid manual QA, good documentation, Jira, cross-browser, some API/SQL exposure
- 60–74: Functional manual tester, basic documentation, limited API/SQL skills
- 45–59: Junior-level manual testing, vague process descriptions
- 0–44: Insufficient QA experience or no evidence of structured testing`,
  },

  generic: {
    persona: "Senior Technical Hiring Lead and Software Engineering Expert",
    title: "Software Engineer",
    evaluationCriteria: `
- Evaluate the candidate purely against the provided Job Description
- Identify must-have vs nice-to-have skills from the JD and assess coverage
- ASSESS: Seniority level, ownership of work, impact and outcomes described
- CHECK: Relevance of past experience to the role, domain familiarity
- RED FLAGS: Frequent unexplained job changes, vague responsibilities, mismatch between claimed title and described work`,
    scoringRubric: `
- 90–100: Exceptional match — meets all must-haves and most nice-to-haves, strong experience signal
- 75–89: Strong match — meets must-haves, minor gaps in nice-to-haves
- 60–74: Partial match — meets most must-haves but notable gaps exist
- 45–59: Weak match — significant skill or experience gaps vs JD
- 0–44: Poor match — does not meet core JD requirements`,
  },
};
