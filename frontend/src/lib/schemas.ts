
import { z } from "zod";

const isoDate = z
  .string({ required_error: "تاریخ الزامی است" })
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "فرمت تاریخ معتبر نیست",
  });

export const termFormSchema = z
  .object({
    name: z.string().min(3, "عنوان حداقل سه نویسه باشد"),
    slug: z
      .string()
      .min(2, "شناسه کوتاه حداقل دو نویسه باشد")
      .regex(
        /^[a-z0-9-]+$/i,
        "شناسه کوتاه فقط شامل حروف، اعداد و خط تیره باشد",
      ),
    description: z
      .string()
      .max(280, "توضیحات حداکثر ۲۸۰ نویسه باشد")
      .optional(),
    starts_at: isoDate,
    ends_at: isoDate,
    is_active: z.boolean().default(false),
  })
  .superRefine((values, ctx) => {
    if (new Date(values.ends_at) < new Date(values.starts_at)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
      });
    }
  });

export const roomFormSchema = z.object({
  name: z.string().min(2, "نام سالن حداقل دو نویسه باشد"),
  capacity: z
    .number({ invalid_type_error: "ظرفیت باید عددی باشد" })
    .int()
    .positive("ظرفیت باید مثبت باشد"),
  code: z.string().optional(),
  campus: z.string().optional(),
  description: z.string().max(280, "توضیحات حداکثر ۲۸۰ نویسه باشد").optional(),
});

export const examFormSchema = z.object({
  title: z.string().min(3, "عنوان درس حداقل سه نویسه باشد"),
  course_code: z.string().min(2, "کد درس حداقل دو نویسه باشد"),
  owner: z
    .number({ invalid_type_error: "شناسه مسئول نامعتبر است" })
    .int()
    .positive(),
  expected_students: z
    .number({ invalid_type_error: "تعداد دانشجویان باید عددی باشد" })
    .int()
    .positive("تعداد دانشجویان باید بزرگتر از صفر باشد"),
  duration_minutes: z
    .number({ invalid_type_error: "مدت زمان باید عددی باشد" })
    .int()
    .positive(),
  term: z
    .number({ invalid_type_error: "شناسه نیمسال نامعتبر است" })
    .int()
    .positive(),
  notes: z.string().max(500, "یادداشت حداکثر ۵۰۰ نویسه باشد").optional(),
});

export const allocationFormSchema = z
  .object({
    exam: z
      .number({ invalid_type_error: "شناسه امتحان نامعتبر است" })
      .int()
      .positive(),
    rooms: z
      .array(
        z
          .number({ invalid_type_error: "شناسه سالن نامعتبر است" })
          .int()
          .positive(),
      )
      .min(1, "حداقل یک سالن انتخاب شود"),
    starts_at: isoDate,
    ends_at: isoDate,
    allocated_seats: z
      .number({ invalid_type_error: "تعداد صندلی باید عددی باشد" })
      .int()
      .positive("حداقل یک صندلی رزرو شود"),
    notes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (new Date(values.ends_at) < new Date(values.starts_at)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
      });
    }
  });


export const blackoutFormSchema = z
  .object({
    room: z.number().int().positive().nullable(),
    all_day: z.boolean().default(true),
    starts_at: isoDate,
    ends_at: isoDate,

    reason: z.string().min(3, "دلیل ممنوعیت حداقل سه نویسه باشد"),
  })
  .superRefine((values, ctx) => {
    if (new Date(values.ends_at) < new Date(values.starts_at)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
      });
    }
  });

export const holidayFormSchema = z
  .object({
    title: z.string().min(2, "عنوان مناسبت حداقل دو نویسه باشد"),

    all_day: z.boolean().default(true),
    starts_at: isoDate,
    ends_at: isoDate,
    room: z.number().int().positive().nullable(),

    description: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (new Date(values.ends_at) < new Date(values.starts_at)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ends_at"],
        message: "تاریخ پایان باید بعد از تاریخ شروع باشد",
      });
    }
  });


export const publicExamFilterSchema = z.object({
  term: z.number().int().positive().optional(),
  date: isoDate.optional(),

  search: z.string().optional(),
});

export type TermFormValues = z.infer<typeof termFormSchema>;
export type RoomFormValues = z.infer<typeof roomFormSchema>;
export type ExamFormValues = z.infer<typeof examFormSchema>;
export type AllocationFormValues = z.infer<typeof allocationFormSchema>;
export type BlackoutFormValues = z.infer<typeof blackoutFormSchema>;
export type HolidayFormValues = z.infer<typeof holidayFormSchema>;
export type PublicExamFilterValues = z.infer<typeof publicExamFilterSchema>;

