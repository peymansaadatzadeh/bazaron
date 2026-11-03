'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setUserEmail(session.user.email)
    }
    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null)
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // تابع اصلی جستجو (مشترک برای فرم و دکمه‌ها)
  const handleSearch = (type: 'products' | 'stores') => {
    if (searchQuery.trim()) {
      router.push(`/${type}?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('') // پاک کردن متن بعد از جستجو
    } else {
      router.push(`/${type}`)
    }
  }

  // وقتی کاربر اینتر می‌زند، پیش‌فرض جستجوی محصول انجام شود
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch('products')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          
          {/* لوگو */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-80 transition-opacity whitespace-nowrap">
              بازار متل قو
            </Link>
          </div>

          {/* نوار جستجو (فقط در صفحه اصلی) */}
          {pathname === '/' && (
            <form 
              onSubmit={handleFormSubmit}
              className="hidden md:flex flex-grow max-w-xl relative bg-gray-50 border border-gray-200 rounded-full px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all"
            >
              <input 
                type="text" 
                placeholder="چه چیزی دنبال می‌کنید؟ (اینتر برای جستجوی محصول)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-gray-700 px-3 py-1 focus:outline-none"
              />
              <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
                <button 
                  type="button"
                  onClick={() => handleSearch('products')} 
                  className="text-xs font-bold text-gray-600 hover:text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-50 transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  محصول
                </button>
                <button 
                  type="button"
                  onClick={() => handleSearch('stores')} 
                  className="text-xs font-bold text-gray-600 hover:text-green-600 px-3 py-1 rounded-full hover:bg-green-50 transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  غرفه
                </button>
              </div>
            </form>
          )}
          
          {/* لینک‌ها و دکمه‌ها */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Link href="/cart" className="group flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition-colors bg-gray-50 hover:bg-blue-50 px-3 sm:px-4 py-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:block">سبد خرید</span>
            </Link>
            
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            {userEmail ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 px-3 sm:px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                  داشبورد
                </Link>
                <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors p-2" title="خروج">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-2 transition-colors">
                  ورود
                </Link>
                <Link href="/register" className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 whitespace-nowrap">
                  ثبت‌نام
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}