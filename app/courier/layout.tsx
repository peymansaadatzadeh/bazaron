'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [courierName, setCourierName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkCourier = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single()
      
      if (profile?.role !== 'courier') {
        router.push('/dashboard')
        return
      }
      
      setCourierName(profile.full_name || 'پیک')
      setLoading(false)
    }
    checkCourier()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // ✅ استفاده از window.location برای پاک شدن کامل کش و سشن
    window.location.href = '/login' 
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-gray-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-lg">
              🛵
            </div>
            <div>
              <h1 className="font-bold text-lg">پنل پیک</h1>
              <p className="text-xs text-gray-400">خوش آمدید، {courierName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/courier" className="text-sm font-bold hover:text-indigo-400 transition-colors hidden sm:block">سفارشات من</Link>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}