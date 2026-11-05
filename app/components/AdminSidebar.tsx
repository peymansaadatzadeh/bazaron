'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems = [
    { name: 'پیشخوان ادمین', href: '/admin', icon: '🏠' },
    { name: 'مدیریت سفارشات', href: '/admin/orders', icon: '📦' },
    { name: 'مدیریت محصولات', href: '/admin/products', icon: '🛍️' },
    { name: 'مدیریت فروشندگان', href: '/admin/sellers', icon: '🏪' }, // آیتم جدید
    { name: 'مدیریت دسته‌بندی‌ها', href: '/admin/categories', icon: '📑' },
    { name: 'مدیریت نظرات', href: '/admin/reviews', icon: '💬' },
    { name: 'مدیریت تسویه‌ها', href: '/admin/withdrawals', icon: '💳' },
    { name: 'گزارش‌های مالی', href: '/admin/finance', icon: '📊' },
  ]

  return (
    <aside className="w-64 bg-white border-l border-gray-200 h-screen sticky top-0 flex flex-col shadow-sm shrink-0" dir="rtl">
      <div className="p-6 border-b border-gray-100 flex items-center justify-center">
        <span className="text-2xl font-black text-indigo-700">پنل مدیریت</span>
      </div>
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>{item.icon}</span>{item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-2xl font-bold">خروج</button>
      </div>
    </aside>
  )
}