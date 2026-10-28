---
phase: 4
plan: 4
wave: 3
gap_closure: false
---

# Plan 4.4: UI/UX Smooth Loading, Micro-Interactions & Transition Enhancements

## Objective
Elevate the portal's user experience by introducing shimmering skeleton loaders, smooth layout and modal transitions, staggered card entrance animations, micro-interactions for copy/action buttons, and smooth progress transitions during document upload and processing.

## Context
Load these files for context:
- frontend/src/index.css
- frontend/src/App.jsx
- frontend/src/components/PracticalList.jsx
- frontend/src/components/SubjectSidebar.jsx
- frontend/src/components/DocxUploadModal.jsx
- frontend/src/components/DocxViewerModal.jsx

## Tasks

<task type="auto">
  <name>Build Shimmer Skeleton Loaders and Progress State System</name>
  <files>
    frontend/src/index.css
    frontend/src/components/PracticalList.jsx
    frontend/src/components/SubjectSidebar.jsx
    frontend/src/App.jsx
  </files>
  <action>
    1. In frontend/src/index.css:
       - Define `@keyframes shimmer`:
         `background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.03) 100%)` with moving background-position.
       - Create reusable `.skeleton-card`, `.skeleton-pill`, `.skeleton-line`, `.skeleton-sidebar-item` styles.
       - Define `@keyframes topProgressBar` and `.global-progress-bar` for sleek indeterminate or upload progress at the top of the viewport.
    2. In frontend/src/components/PracticalList.jsx:
       - Accept `isLoading` prop from `App.jsx`.
       - When `isLoading` is true, render 4-6 animated skeleton practical cards that match the layout (badge, title, description line, code snippet box, footer) instead of showing an empty screen or abrupt flash.
    3. In frontend/src/components/SubjectSidebar.jsx:
       - Add skeleton loader items when subjects are being initially loaded.
    AVOID: Layout shifts where skeleton dimensions differ from loaded cards.
    USE: Identical aspect ratios and padding for skeleton placeholders.
  </action>
  <verify>
    cd frontend && npm run build
  </verify>
  <done>
    Frontend builds and displays fluid skeleton placeholders during API fetches without layout shift.
  </done>
</task>

<task type="auto">
  <name>Implement Motion Easing, Modal Transitions, and Staggered Card Entrance</name>
  <files>
    frontend/src/index.css
    frontend/src/components/PracticalList.jsx
    frontend/src/App.jsx
  </files>
  <action>
    1. In frontend/src/index.css:
       - Define premium easing variables:
         - `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`
         - `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`
       - Add modal overlay and content entrance animations:
         - `@keyframes overlayFadeIn` (opacity 0 -> 1)
         - `@keyframes modalSlideUp` (transform: translateY(12px) scale(0.97), opacity 0 -> transform: translateY(0) scale(1), opacity 1)
       - Add staggered entrance for practical cards:
         - `@keyframes cardEntrance` (opacity 0, translateY(10px) -> opacity 1, translateY(0))
         - Stagger delay using CSS `:nth-child(n)` for up to 12 items (0.04s stagger increments).
       - Add micro-animations:
         - `@keyframes bounceCheck` for the copy button checkmark icon to give immediate tactile feedback.
         - Active tab / language pill slide/glow indicator transitions.
         - Card hover elevation with soft radial glow transition.
    2. In frontend/src/components/PracticalList.jsx:
       - Apply entrance animation class keyed to the active subject ID so switching subjects triggers a smooth, orchestrated card reveal.
  </action>
  <verify>
    cd frontend && npm run build
  </verify>
  <done>
    Modals open with fluid spring-damped transitions, cards reveal with staggered animations, and copy buttons provide animated visual feedback.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Skeleton loaders display during data fetching without layout flickering.
- [ ] Modals enter smoothly with scale and fade animations.
- [ ] Practical cards animate into view with staggered timing when switching subjects.
- [ ] Hover and copy micro-interactions feel tactile and responsive.

## Success Criteria
- [ ] All tasks verified passing
- [ ] Must-haves confirmed
- [ ] Frontend production build passes with zero errors
