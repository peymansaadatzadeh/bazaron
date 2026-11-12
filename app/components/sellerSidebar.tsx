'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SellerSidebar({ 
  storeName, 
  logoUrl,
  isOpen,
  onClose
}: { 
  storeName: string, 
  logoUrl: string | null,
  isOpen: boolean,
  onClose: () => void
}) {
  const pathname = usePathname()

  const menuItems = [
    { name: 'داشبورد فروشگاه', href: '/dashboard/store-panel', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'محصولات', href: '/dashboard/store-panel/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { name: 'سفارشات', href: '/dashboard/store-panel/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { name: 'پیام‌ها', href: '/dashboard/store-panel/messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { name: 'گزارشات مالی', href: '/dashboard/store-panel/finance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'تنظیمات فروشگاه', href: '/dashboard/store-panel/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ]

  return (
    <aside 
      className={`fixed md:sticky top-0 right-0 z-50 w-64 bg-gray-900 text-white border-l border-gray-800 h-screen flex flex-col shadow-2xl md:shadow-lg shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      dir="rtl"
    >
      <div className="md:hidden flex justify-end p-4 pb-0">
        <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 border-b border-gray-800 flex items-center gap-3 mt-4 md:mt-0">
        <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-sm overflow-hidden shrink-0 border border-gray-700">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="w-full h-full object-cover" />
          ) : (
            storeName.charAt(0)
          )}
        </div>
        <div>
          <h2 className="font-bold text-white text-sm line-clamp-1">{storeName}</h2>
          <span className="text-xs text-gray-400">پنل فروشندگی</span>
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all font-medium text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          بازگشت به داشبورد کاربری
        </Link>
      </div>
    </aside>
  )
}