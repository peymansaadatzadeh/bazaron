'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminSidebar() {
  const pathname = usePathname()

  const menuItems = [
    { name: 'داشبورد مدیریت', href: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'مدیریت سفارشات', href: '/admin/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'مدیریت نظرات', href: '/admin/reviews', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { name: 'مدیریت محصولات', href: '/admin/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { name: 'مدیریت دسته‌بندی‌ها', href: '/admin/categories', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  ]

  return (
    <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white h-screen sticky top-0 flex flex-col shadow-2xl hidden md:flex border-l border-slate-800">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-violet-500/30">
            م
          </div>
          <div>
            <h2 className="font-bold text-white text-[15px] tracking-tight">پنل مدیریت</h2>
            <span className="text-xs text-slate-400 font-medium">بازار متل قو</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 font-medium text-[13.5px] ${
                isActive 
                  ? 'bg-gradient-to-l from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25' 
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-[18px] w-[18px] transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/80">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-800/70 hover:text-white transition-all font-medium text-[13.5px] group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] text-slate-500 group-hover:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          خروج از پنل مدیریت
        </Link>
      </div>
    </aside>
  )
}