'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
// ✅ آپدیت شد به حروف کوچک
import UserSidebar from '../components/userSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [store, setStore] = useState<any>(null)
  const [role, setRole] = useState('customer')
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      
      setUserEmail(session.user.email ?? null)
      
      const { data: profile } = await supabase.from('profiles').select('role, first_name').eq('id', session.user.id).single()
      
      if (profile && (!profile.first_name || profile.first_name === '')) {
        router.push('/complete-profile')
        return
      }

      if (profile) setRole(profile.role)
      
      const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', session.user.id).maybeSingle()
      if (storeData) setStore(storeData)
      
      setLoading(false)
    }
    fetchUser()
  }, [router])

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  if (pathname.startsWith('/dashboard/store-panel')) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <header className="md:hidden fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 shadow-sm">
        <span className="font-bold text-gray-800 text-lg">پنل کاربری</span>
        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <UserSidebar 
        userEmail={userEmail} 
        store={store} 
        role={role} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-grow p-4 pt-20 md:pt-8 sm:p-8 md:pr-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}