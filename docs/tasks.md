### CORE FEATURES

#### Global UI & Layout

- [x] Update header layout to correctly scale on smartphones
- [x] Fix the overlapping issue with the bottom 00:00 label

#### Craft Space (Kanban)

- [x] Implement vintage Kanban board module

### BACKEND & DATA

#### Database (Supabase)

- [ ] Prepare JSON structural models for Supabase integration

#### Client State

- [ ] Set up user session caching

### POLISHING

#### Craft Space (Kanban)

- [x] Finalize aesthetic touches on the Craft Space tickets
- [x] Implement color palette adjustments for vintage tickets

### AGENT TASKS

#### Frontend (Craft Space)

- [x] Integrate HTML5 Drag-and-Drop across Kanban columns
- [x] Convert Kanban layout to CSS Flex/Grid for dynamic expansion
- [x] Implement horizontal Smart Scroll translation functionality
- [x] Fix SPA DOM clone node duplication bug causing UI rendering freeze

#### Frontend (SPA Navigation)

- [x] Stabilize original-block slide navigation for MacBook trackpad
- [x] Prevent trackpad overshoot and blink on inertial swipe
- [x] Suppress horizontal trackpad slide jitter before block switch
- [x] Speed up consecutive trackpad swipes between slides
- [x] Open the current slide with Enter
- [x] Add keyboard arrow navigation for slide switching
- [x] Add `Esc` to close the currently open block

#### Frontend (Header UI)

- [x] Add cookbook-style auth/register form next to the header clock
- [x] Move header auth into a separate module with forms and avatar state
- [x] Close header auth popovers on block open and raise them above active blocks
- [x] Keep only the login trigger in the header and open registration from the form
- [x] Add forgot-password flow from the login form
- [x] Improve auth email validation and add smooth form animations
- [x] Make auth form switching smoother and add a dev avatar drawer next to login

#### Frontend (Profile)

- [x] Add a dedicated profile module with full-page view, summary stats, and recipe previews
- [x] Restyle profile drawer and profile page closer to the recipe-book visual language
- [x] Keep the profile drawer within the content area, add explicit close action, and support closing with `Esc`

#### Frontend (Recipe Book)

- [x] Reduce left side tabs and bottom ribbons on low-height desktops

#### Project Maintenance

- [x] Log completed changes in CHANGELOG.md and update tasks.md
