'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // بررسی اینکه آیا کاربر لاگین است یا خیر
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login') // اگر لاگین نبود، بفرست به صفحه ورود
      } else {
        setUserEmail(session.user.email ?? null)
      }
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">داشبورد</h1>
        <p className="text-gray-700 mb-6">شما با موفقیت وارد شدید!</p>
        <p className="font-mono bg-gray-100 p-2 rounded mb-6">{userEmail}</p>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition-colors"
        >
          خروج از حساب
        </button>
      </div>
    </div>
  )
}