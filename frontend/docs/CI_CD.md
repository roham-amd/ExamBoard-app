# خط لوله CI/CD — فاز ۹

## نمای کلی

Workflow «Frontend CI» در GitHub Actions روی Pull Request ها و پوش به شاخهٔ `main` اجرا می‌شود. این گردش‌کار پنج شغل موازی/وابسته دارد که سلامت پروژه را تضمین می‌کنند:

1. **Lint & Format**: اجرای `npm run lint` و `npm run format:check` برای کنترل ESLint و Prettier.
2. **Type Check**: اجرای `npm run typecheck` با `tsc --noEmit`.
3. **Unit & Component Tests**: اجرای `npm run test -- --coverage` برای Vitest به همراه پوشش V8.
4. **Next.js Build**: پس از موفقیت شغل‌های قبلی، `npm run build` برای تایید خروجی تولید.
5. **Cypress E2E**: با تکیه بر خروجی Build، اسکریپت `npm run test:e2e` سرور standalone را با `HOSTNAME=0.0.0.0` بالا می‌آورد، سلامت `http://localhost:3000/healthz` را بررسی می‌کند و سپس `cypress run` را headless اجرا می‌کند.

تمام شغل‌ها از `actions/setup-node@v4` با کش `npm` و `frontend/package-lock.json` استفاده می‌کنند تا نصب‌ها سریع‌تر انجام شود.

## اجرای مجدد (Re-run)

در صفحهٔ Actions مربوط به PR یا commit، روی شغل ناموفق کلیک کرده و گزینهٔ **Re-run jobs** یا **Re-run failed jobs** را انتخاب کنید. برای بررسی لاگ‌ها می‌توانید به تب‌های هر استپ مراجعه کنید؛ خطاهای lint/test دقیقاً به همان فرمان‌های npm اشاره دارند.

## متغیرهای محیطی

تمام فرمان‌ها در دایرکتوری `frontend/` اجرا می‌شوند و به متغیر اضافی نیاز ندارند. برای سناریوهای خاص (مثلاً سرویس‌های خارجی) می‌توان از Secrets سازمانی بهره برد، اما در حالت پیش‌فرض pipeline فقط به تنظیمات `.env.example` متکی است.
