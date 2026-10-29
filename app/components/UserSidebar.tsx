'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// پراپ role اضافه شد
export default function UserSidebar({ userEmail, store, role }: { userEmail: string | null, store: any, role: string }) {
  const pathname = usePathname()

  const menuItems = [
    { name: 'داشبورد', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'سفارشات', href: '/dashboard/my-orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'پیام‌ها', href: '/dashboard/messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { name: 'نظرات', href: '/dashboard/reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { name: 'علاقه‌مندی', href: '/dashboard/favorites', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { name: 'کیف پول', href: '/dashboard/wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { name: 'اطلاعات حساب', href: '/dashboard/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ]

  return (
    <aside className="w-72 bg-white border-l border-gray-100 h-screen sticky top-0 flex flex-col shadow-sm hidden md:flex">
      {/* هدر پروفایل */}
      <div className="p-6 border-b border-gray-100 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-2xl shadow-sm border border-indigo-100 mb-3">
          {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
        </div>
        <h2 className="font-bold text-gray-800 text-sm">{userEmail}</h2>
        <span className="text-xs text-gray-400 mt-1">کاربر بازار</span>
      </div>

      {/* لیست منوها */}
      <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {item.name}
            </Link>
          )
        })}

        {/* دکمه اختصاصی مدیر */}
        {role === 'admin' && (
          <div className="pt-2 mt-2 border-t border-gray-100">
            <Link 
              href="/admin" 
              className="flex items-center justify-between bg-red-50 text-red-700 px-4 py-3 rounded-xl hover:bg-red-100 transition-colors font-bold text-sm border border-red-100"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                پنل مدیریت کل
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
          </div>
        )}
      </nav>

      {/* بخش پایین: فروشگاه من */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <p className="text-xs font-bold text-gray-500 mb-3 px-2">فروشگاه‌های من</p>
        {store ? (
          <Link href="/dashboard/store-panel" className="flex items-center justify-between bg-white p-3 rounded-xl border border-green-200 hover:border-green-400 transition-colors">
            <span className="text-sm font-bold text-gray-800">{store.name}</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold">مدیریت</span>
          </Link>
        ) : (
          <Link href="/dashboard/create-store" className="flex items-center justify-center gap-2 w-full bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors font-bold text-sm shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            ساخت فروشگاه
          </Link>
        )}
      </div>
    </aside>
  )
}