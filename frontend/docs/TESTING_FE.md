# تست‌های فرانت‌اند — فاز ۹

## Vitest (واحد و کامپوننت)

- اجرای تمام تست‌ها همراه با پوشش: `npm run test`
- حالت تماشاگر: `npm run test:watch`
- محیط آزمایش `jsdom` از طریق `vitest.config.ts` و `test/setup.ts` فراهم شده است.
- نمونه پوشش:
  - `src/lib/__tests__/dayjs.test.ts` اطمینان می‌دهد که پیکربندی `jalaliday` تاریخ میلادی را به صورت جلالی نمایش می‌دهد.
  - `src/components/allocations/__tests__/allocations-timeline.test.tsx` رندر ردیف‌های سالن و کارت‌های تخصیص را ماک کرده و صحت داده‌های تایم‌لاین را بررسی می‌کند.
  - `src/components/auth/__tests__/login-form.test.tsx` ارسال فرم ورود و نمایش خطای سرور را شبیه‌سازی می‌کند.

## Cypress E2E

- اجرا: `npm run test:e2e` (پیش‌نیاز: `npm run build` در همان جلسهٔ CI/محلی).
- ابزار `start-server-and-test` سرور `next start` را با `HOSTNAME=0.0.0.0` بالا آورده و پیش از اجرای headless `cypress run` سلامت مسیر `http://localhost:3000/healthz` را (با انتظار دریافت پاسخ ۲۰۰ JSON) بررسی می‌کند.
- سناریوهای موجود در `cypress/e2e/phase7.cy.ts`:
  - ورود کاربر و نمایش پیام خطای بازگشتی از سرور.
  - فیلتر جدول زمانی عمومی بر اساس جستجو.
  - ساخت امتحان جدید و تلاش برای ثبت تخصیص با پاسخ خطای «ظرفیت کافی نیست.»

## پوشش و گزارش‌دهی

- خروجی HTML و متنی پوشش Vitest در `coverage/unit` تولید می‌شود.
- می‌توان نتایج پوشش را برای ابزارهایی مثل Codecov آپلود کرد؛ در CI فعلی فقط گزارش محلی تولید می‌شود.
- برای مشاهده جزئیات، فایل `coverage/unit/index.html` را در مرورگر باز کنید.
