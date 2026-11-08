'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import SellerSidebar from '../../components/SellerSidebar' // مسیر را چک کنید

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkStore = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', session.user.id).maybeSingle()
      if (storeData) setStore(storeData)
      setLoading(false)
    }
    checkStore()
  }, [router])

  if (loading) return <div className="flex justify-center items-center min-h-screen">در حال بارگذاری...</div>
  if (!store) return <div className="p-8 text-center">غرفه‌ای یافت نشد.</div>

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* ✅ اضافه کردن logoUrl */}
      <SellerSidebar storeName={store.name} logoUrl={store.logo_url} />
      <main className="flex-grow p-4 sm:p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  )
}
