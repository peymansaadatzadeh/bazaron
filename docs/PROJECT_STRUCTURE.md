# ساختار پروژه بازار متل قو

## مسیر پروژه
D:\my project\bazare-motelghoo

## ساختار اصلی
```text
bazare-motelghoo/
├── docs/                  # فایل‌های مستندات پروژه
│   ├── PROJECT_STATUS.md
│   ├── PROJECT_PLAN.md
│   ├── TECHNICAL_DECISIONS.md
│   └── PROJECT_STRUCTURE.md
├── public/                # فایل‌های استاتیک (تصاویر، آیکون‌ها)
├── src/                   # کدهای اصلی برنامه
│   └── app/               # صفحات و مسیرهای Next.js (App Router)
│       ├── layout.tsx     # چیدمان اصلی سایت
│       └── page.tsx       # صفحه اصلی سایت
├── .gitignore             # فایل‌هایی که Git نباید ذخیره کند
├── package.json           # تنظیمات و وابستگی‌های پروژه
├── next.config.ts         # تنظیمات Next.js
└── tsconfig.json          # تنظیمات TypeScript