# Theming & RTL Guidelines

## Tailwind Configuration

- RTL support is enabled through [`tailwindcss-rtl`](https://github.com/20lives/tailwindcss-rtl). Use logical utilities such as `border-s`, `border-e`, `ps-*`, and `pe-*` to avoid direction-specific classes.
- The design tokens (`--background`, `--primary`, etc.) are defined in `src/styles/globals.css` and map to Tailwind via CSS variables. Update them when extending the palette.
- Typography relies on the Google `Vazirmatn` font through `next/font`. Use `font-sans` to inherit the configured stack.

## Layout Patterns

- Wrapper layout lives in `AppShell` (`src/components/layout/app-shell.tsx`). Combine `flex` + logical paddings/margins to keep components mirrored correctly in RTL.
- Prefer utility classes such as `rtl:space-x-reverse` on horizontal flex containers to ensure consistent spacing in both directions.
- Shared UI pieces (buttons, dialogs, toasts) come from `src/components/ui/`. Extend them using Tailwind’s `@apply` within the component file when custom variants are needed.

## Visual States

- Use the color tokens for backgrounds, borders, and states instead of raw hex values.
- The light/dark surface hierarchy follows the shadcn/ui defaults; when adding new components, keep borders at `border-border` and text at `text-foreground` or `text-muted-foreground`.
