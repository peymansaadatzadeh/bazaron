'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import AdminSidebar from '../components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // ✅ استیت منو
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role !== 'admin') { 
        router.push('/dashboard'); 
        return 
      }
      setLoading(false)
    }
    checkAdmin()
  }, [router])

  // بستن منو هنگام تغییر مسیر
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div></div>

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      
      {/* ✅ هدر موبایل ادمین */}
      <header className="md:hidden fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 shadow-sm">
        <span className="font-bold text-indigo-700 text-lg">پنل مدیریت</span>
        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* ✅ بک‌دراپ موبایل */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <AdminSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-grow p-4 pt-20 md:pt-8 sm:p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}