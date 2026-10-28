import { siteConfig } from "./config";

export const locales = ["en", "fa"] as const;
export type Locale = (typeof locales)[number];

const year = new Date().getFullYear();
const english = {
  name: siteConfig.name,
  title: siteConfig.title,
  description: siteConfig.description,
  pageTitle: `${siteConfig.name} - ${siteConfig.title}`,
  aboutMe: siteConfig.aboutMe,
  nav: { about: "About", projects: "Projects", experience: "Experience", education: "Education" },
  headings: { about: "About Me", projects: "Projects", experience: "Experience", education: "Education" },
  hero: { greeting: "Hello! 👋", introduction: "I'm ", outro: "" },
  social: { email: "Email", linkedin: "LinkedIn", github: "GitHub", twitter: "Twitter" },
  language: { label: "فارسی", action: "Switch to Persian" },
  copyright: `© ${year} ${siteConfig.name}. All rights reserved.`,
  skills: siteConfig.skills,
  projects: siteConfig.projects.map((project, index) => ({
    name: project.name,
    description: project.description,
    skills: project.skills,
    number: String(index + 1).padStart(2, "0"),
  })),
  experience: siteConfig.experience.map(({ company, title, dateRange, bullets }) => ({ company, title, dateRange, bullets })),
  education: siteConfig.education.map(({ school, degree, dateRange, achievements }) => ({
    school, degree, dateRange, achievements: achievements as string[],
  })),
};

const persian: typeof english = {
  name: "سروش لطفی",
  title: "مهندس نرم‌افزار و علاقه‌مند به هوش مصنوعی",
  description: "وب‌سایت شخصی و نمونه‌کارهای سروش لطفی",
  pageTitle: "سروش لطفی - مهندس نرم‌افزار و علاقه‌مند به هوش مصنوعی",
  aboutMe: "به آگاهی، کامپیوتر و ریاضی علاقه دارم؛ به هر چیزی که کمک کند زندگی را بهتر بفهمم!",
  nav: { about: "درباره من", projects: "پروژه‌ها", experience: "تجربه کاری", education: "تحصیلات" },
  headings: { about: "درباره من", projects: "پروژه‌ها", experience: "تجربه کاری", education: "تحصیلات" },
  hero: { greeting: "سلام! 👋", introduction: "من ", outro: " هستم" },
  social: { email: "ایمیل", linkedin: "لینکدین", github: "گیت‌هاب", twitter: "توییتر" },
  language: { label: "English", action: "تغییر زبان به انگلیسی" },
  copyright: `© ${new Intl.NumberFormat("fa", { useGrouping: false }).format(year)} سروش لطفی. تمامی حقوق محفوظ است.`,
  skills: ["C++", "Python", "Qt", "الگوهای طراحی", "OOA&D", "شبکه‌های عصبی"],
  projects: [
    {
      name: "ChemQC",
      description: "نرم‌افزار مدیریت اطلاعات آزمایشگاهی (LIMS) برای مدیریت داده‌های تولیدشده در کارخانه‌های پلیمر.",
      skills: ["Qt", "C++", "SQL"],
      number: "۰۱",
    },
    {
      name: "DiamondBot",
      description: "ربات فارسی تلگرام برای مشاوره تحصیلی؛ با امکانات ثبت‌نام دانش‌آموزان، لینک‌های معرفی، خرید محصولات از طریق زرین‌پال یا اپراتور، گفت‌وگو با مشاور، اعلان‌های مدیر، خروجی صفحه‌گسترده اطلاعات مشتریان و بارگذاری و دریافت فایل‌های PDF دانش‌آموزان.",
      skills: ["Python", "Docker", "PostGreSQL"],
      number: "۰۲",
    },
  ],
  experience: [
    {
      company: "پیشرو هوشمند سپاهان",
      title: "توسعه‌دهنده هوش مصنوعی",
      dateRange: "اوت ۲۰۲۳ تا اکتبر ۲۰۲۵",
      bullets: [
        "طراحی راهکارهای هوش مصنوعی برای مسائل صنعتی",
        "توسعه نرم‌افزار با Qt",
        "گاهی هم کمی مهندسی معکوس",
      ],
    },
  ],
  education: [
    {
      school: "دانشگاه شهید بهشتی",
      degree: "کارشناسی ارشد مهندسی کامپیوتر، گرایش معماری کامپیوتر",
      dateRange: "۲۰۲۵ تا ۲۰۲۷",
      achievements: [],
    },
    {
      school: "دانشگاه صنعتی اصفهان",
      degree: "کارشناسی مهندسی کامپیوتر، گرایش هوش مصنوعی",
      dateRange: "۲۰۲۵ تا ۲۰۲۱",
      achievements: [],
    },
  ],
};

export const catalogs = { en: english, fa: persian };

type TextPath<T> = T extends string ? never : {
  [K in keyof T & (string | number)]: T[K] extends string ? `${K}`
    : T[K] extends Array<infer Item> ? Item extends string ? `${K}.${number}`
      : `${K}.${number}.${TextPath<Item>}`
    : `${K}.${TextPath<T[K]>}`;
}[keyof T & (string | number)];

export type TranslationKey = TextPath<typeof english>;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fa";
}

export function t(key: TranslationKey, locale: Locale = "en"): string {
  let value: unknown = catalogs[locale];
  for (const part of key.split(".")) {
    value = (value as Record<string, unknown>)[part];
  }
  if (typeof value !== "string") {
    throw new Error(`Missing ${locale} translation: ${key}`);
  }
  return value;
}
