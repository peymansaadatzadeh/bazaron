'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SellerSidebar from '../../components/SellerSidebar'

export default function SellerPanelLayout({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<any>(null)
  const [isPending, setIsPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkStore = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', session.user.id).maybeSingle()
      
      if (storeData && storeData.status === 'active') {
        setStore(storeData)
      } else if (storeData && storeData.status !== 'active') {
        setIsPending(true)
      } else {
        router.push('/dashboard/create-store') 
      }
      setLoading(false)
    }
    checkStore()
  }, [router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-10 -mt-10"></div>
          
          <div className="relative z-10 w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="relative z-10 text-2xl font-black text-gray-800 mb-3">
            غرفه در انتظار تایید
          </h2>
          
          <p className="relative z-10 text-gray-600 mb-8 leading-relaxed text-sm">
            غرفه شما با موفقیت ثبت شده است اما هنوز توسط مدیر تایید نشده است. پس از بررسی و تایید مدیر، می‌توانید وارد پنل فروشندگی شوید.
          </p>
          
          <Link href="/dashboard" className="relative z-10 w-full block bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">
            بازگشت به داشبورد عمومی
          </Link>
        </div>
      </div>
    )
  }

  if (!store) return null

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* ✅ پاس دادن logoUrl به سایدبار */}
      <SellerSidebar storeName={store.name} logoUrl={store.logo_url} />
      
      <main className="flex-grow p-4 sm:p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}