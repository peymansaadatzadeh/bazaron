'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import SellerSidebar from '../../components/SellerSidebar'

export default function StorePanelLayout({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkStore = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', session.user.id).maybeSingle()
      
      // اگر غرفه نداشت یا تایید نشده بود، به داشبورد اصلی برمیگردد
      if (storeData && storeData.status === 'active') {
        setStore(storeData)
      } else {
        router.push('/dashboard')
      }
      setLoading(false)
    }
    checkStore()
  }, [router])

  if (loading || !store) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <SellerSidebar storeName={store.name} />
      <main className="flex-grow p-4 sm:p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}