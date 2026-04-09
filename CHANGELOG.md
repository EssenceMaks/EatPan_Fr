# EatPan Frontend Changelog

## [1.0.0] - 2026-04-09

### Added
- **UI Architecture (Arc Bento Header Full)**: Integrated the RPG-themed "flared bento" header. Implemented dynamic "Guest" vs "Authenticated" layout morphing with precision CSS corner flares that map seamlessly to the structural grid parameters.
- **Configuration Security Management**: Extracted all sensitive API credentials (Google Client ID, Supabase URL/Anon Key) into a standard `src/core/config.js` file (secured via `.gitignore`). Added `config.example.js` for safe developer onboarding.
- **Local Storage Telemetry**: Implemented `localStorage` caching for the web authentication `nonce`. This resolves silent cross-tab authorization desyncs and browser strict-cache resets.

### Changed
- **Google Identity (FedCM / One Tap) Flow**: Refactored the token exchange initialization. The native Google One Tap popup is no longer spammed on load; it is now elegantly summoned on-demand when the user clicks our custom "Google Auth" button.
- **AppShell State Transitions**: Upgraded `AppShell.js` to context-switch dynamically between unauthenticated layouts and the personalized `UserProfilePanel` layout based on live Supabase auth-state subscriptions.

### Fixed
- **Google / Supabase Token 'Nonce' Mismatch (400 Bad Request)**: Engineered a self-healing fallback mechanism that locally decrypts and inspects the Google JWT payload before transmitting it. By dynamically detecting missing nonce claims caused by Google's aggressive credential caching, the code mathematically restructures the Supabase request payload to guarantee seamless, "red-error-free" sign-ins.
- **Profile Avatars Blocked (403 Forbidden)**: Patched `<img>` structures in `UserProfilePanel` and bento headers with the `referrerpolicy="no-referrer"` attribute to bypass Chrome's cross-origin protection rendering errors for Google avatars.
- **CSS Bento Corner "Bleeding"**: Eliminated hardcoded background masks for the bento flared corners (`arc-bento-full__corner-tr`, etc.), forcing them to inherit proper opacity and masking rather than clashing with the global RPG-themed body background.

