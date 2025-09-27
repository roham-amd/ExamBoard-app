export const locales = ["fa"] as const;
export const defaultLocale = "fa";

export type Locale = (typeof locales)[number];
