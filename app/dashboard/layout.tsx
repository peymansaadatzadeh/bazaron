'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import UserSidebar from '../components/UserSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [store, setStore] = useState<any>(null)
  const [role, setRole] = useState('customer')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname() // گرفتن آدرس فعلی صفحه

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      
      setUserEmail(session.user.email ?? null)
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile) setRole(profile.role)
      
      const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', session.user.id).maybeSingle()
      if (storeData) setStore(storeData)
      
      setLoading(false)
    }
    fetchUser()
  }, [router])

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  // اگر کاربر در بخش پنل فروشنده است، سایدبار کاربری را نشان نده و فقط محتوا را رندر کن
  if (pathname.startsWith('/dashboard/store-panel')) {
    return <>{children}</>
  }

  // در غیر این صورت، سایدبار کاربری را با محتوا نشان بده
  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <UserSidebar userEmail={userEmail} store={store} role={role} />
      <main className="flex-grow p-4 sm:p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}