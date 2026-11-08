'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }
    fetchSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="text-2xl font-black text-indigo-600">بازار متل قو</Link>
            <div className="hidden md:flex gap-4 font-medium text-gray-600">
              <Link href="/products" className="hover:text-indigo-600">محصولات</Link>
              <Link href="/stores" className="hover:text-indigo-600">غرفه‌ها</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="text-gray-600 hover:text-indigo-600 font-bold flex items-center gap-1">
              سبد خرید
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">داشبورد</Link>
                <button onClick={handleLogout} className="text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100">خروج</button>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-bold text-white bg-indigo-600 px-6 py-2 rounded-xl hover:bg-indigo-700">ورود / ثبت‌نام</Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
