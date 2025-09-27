# Frontend Internationalisation

## Locale Setup

- `fa` (Persian) is the default and only locale for Phase 1. Supported locales are defined in `src/i18n/config.ts` and consumed by `next-intl` middleware.
- The middleware (`frontend/middleware.ts`) enforces `/fa/...` prefixed routes and prevents locale-less navigation.

## Messages & Namespaces

- Translation files live under `src/i18n/messages/`. Keep keys namespaced by feature (e.g., `layout`, `dashboard`, `timetable`).
- Components retrieve strings with `useTranslations('namespace')` on the client or `getTranslations('namespace')` on the server. Avoid hardcoded UI text in JSX.
- For reusable UI (dialogs, toasts), pass translated labels/strings from the consuming component.

## Plurals & Interpolation

- Use ICU syntax for pluralisation or variable placeholders. Example:
  ```json
  {
    "examCount": "{count, plural, one {یک امتحان} other {{count} امتحان}}"
  }
  ```
  Consume via `t('examCount', { count })`.
- Dates should be formatted with `dayjs` (`src/lib/dayjs.ts`) which is pre-configured for Jalali calendar and Persian locale. Pass formatted values into translation placeholders like `{date}`.

## Adding Locales

- Add the locale code to `locales` in `src/i18n/config.ts` and create a matching JSON file in `src/i18n/messages/`.
- Update copy for sidebar/topbar navigation to keep routing consistent across languages.
- Review middleware matcher rules if introducing public pages that should bypass locale routing.
