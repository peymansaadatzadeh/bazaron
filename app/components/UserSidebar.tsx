'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function UserSidebar({ userEmail, store, role }: { userEmail: string | null, store: any, role: string }) {
  const pathname = usePathname()

  const menuItems = [
    { name: 'داشبورد', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'سفارشات', href: '/dashboard/my-orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'پیام‌ها', href: '/dashboard/messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { name: 'نظرات', href: '/dashboard/reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { name: 'علاقه‌مندی', href: '/dashboard/favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    // ✅ گزینه کیف پول از اینجا حذف شد
    { name: 'اطلاعات حساب', href: '/dashboard/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ]

  return (
    <aside className="w-72 bg-white border-l border-gray-200 h-screen sticky top-0 flex-col shadow-sm hidden md:flex" dir="rtl">
      
      {/* هدر پروفایل */}
      <div className="relative p-8 border-b border-gray-100 flex flex-col items-center justify-center text-center bg-gradient-to-b from-indigo-50/50 to-white overflow-hidden">
        {/* افکت دکوراتیو پس‌زمینه */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-100 to-blue-50 opacity-50"></div>
        
        <div className="relative z-10 w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-500 text-white rounded-full flex items-center justify-center font-black text-3xl shadow-lg border-4 border-white mb-3">
          {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
        </div>
        <h2 className="relative z-10 font-bold text-gray-800 text-sm truncate w-full" dir="ltr">{userEmail}</h2>
        <span className="relative z-10 text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full mt-2">کاربر بازار متل قو</span>
      </div>

      {/* لیست منوها */}
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          // بررسی دقیق برای فعال بودن منو
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname.startsWith(item.href)

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5} d={item.icon} />
              </svg>
              {item.name}
            </Link>
          )
        })}

        {/* دکمه اختصاصی مدیر */}
        {role === 'admin' && (
          <div className="pt-3 mt-3 border-t border-gray-100">
            <Link 
              href="/admin" 
              className="group flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 text-red-700 px-4 py-3 rounded-2xl hover:from-red-100 hover:to-orange-100 transition-all duration-300 font-bold text-sm border border-red-100"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                پنل مدیریت کل
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
          </div>
        )}
      </nav>

      {/* بخش پایین: فروشگاه من */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/80 rounded-t-3xl">
        <p className="text-xs font-bold text-gray-500 mb-3 px-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          فروشگاه‌های من
        </p>
        
        {store ? (
          <Link 
            href="/dashboard/store-panel" 
            className="flex items-center justify-between bg-white p-3.5 rounded-2xl border-2 border-green-100 hover:border-green-400 transition-colors shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <span className="text-sm font-bold text-gray-800 line-clamp-1">{store.name}</span>
            </div>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold whitespace-nowrap">مدیریت</span>
          </Link>
        ) : (
          <Link 
            href="/dashboard/create-store" 
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3.5 rounded-2xl hover:shadow-lg hover:shadow-red-500/30 transition-all transform hover:-translate-y-0.5 font-bold text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            ساخت فروشگاه جدید
          </Link>
        )}
      </div>
    </aside>
  )
}