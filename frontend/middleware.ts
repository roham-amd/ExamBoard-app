
import createIntlMiddleware from "next-intl/middleware";

import { defaultLocale, locales } from "@/src/i18n/config";

export default createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  matcher: ["/((?!api|_next|public|.*\..*).*)"],
};

