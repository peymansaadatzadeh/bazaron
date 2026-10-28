'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUserEmail(session.user.email)
      }
    }
    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white shadow-sm py-4 mb-6">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        {/* سمت راست: لوگو */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          بازار متل قو
        </Link>
        
        {/* سمت چپ: لینک‌ها و وضعیت کاربر */}
        <div className="flex items-center gap-6">
          <Link href="/cart" className="text-gray-700 hover:text-blue-600 font-bold transition-colors">
            سبد خرید
          </Link>
          
          <div className="h-6 w-px bg-gray-300"></div> {/* خط جداکننده */}

          {userEmail ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden md:block">{userEmail}</span>
              <Link href="/dashboard" className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors font-medium">
                داشبورد
              </Link>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
                خروج
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-600 hover:text-blue-600 px-2 py-2 transition-colors">
                ورود
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                ثبت‌نام
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}