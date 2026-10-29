'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function UserDashboardPage() {
  const [orderStats, setOrderStats] = useState({ all: 0, pending: 0, shipped: 0, completed: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase.from('orders').select('status').eq('customer_id', session.user.id)
      
      if (data) {
        setOrderStats({
          all: data.length,
          pending: data.filter(o => o.status === 'pending_payment' || o.status === 'pending_seller').length,
          shipped: data.filter(o => o.status === 'shipped').length,
          completed: data.filter(o => o.status === 'delivered').length,
          cancelled: data.filter(o => o.status === 'cancelled').length
        })
      }
      setLoading(false)
    }
    fetchOrders()
  }, [router])

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری...</div>

  return (
    <div className="space-y-8">
      
      {/* بخش سفارشات من */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">سفارشات من</h2>
          <Link href="/dashboard/my-orders" className="text-sm text-indigo-600 font-bold hover:underline">مشاهده همه</Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* باکس همه */}
          <Link href="/dashboard/my-orders" className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <span className="text-sm font-bold text-gray-700">همه</span>
            <span className="text-xs text-gray-400 mt-1">({orderStats.all})</span>
          </Link>

          {/* باکس در انتظار */}
          <Link href="/dashboard/my-orders" className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-sm font-bold text-gray-700">در انتظار تایید</span>
            <span className="text-xs text-gray-400 mt-1">({orderStats.pending})</span>
          </Link>

          {/* باکس ارسال شده */}
          <Link href="/dashboard/my-orders" className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
            </div>
            <span className="text-sm font-bold text-gray-700">ارسال شده</span>
            <span className="text-xs text-gray-400 mt-1">({orderStats.shipped})</span>
          </Link>

          {/* باکس تکمیل شده */}
          <Link href="/dashboard/my-orders" className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-sm font-bold text-gray-700">تکمیل شده</span>
            <span className="text-xs text-gray-400 mt-1">({orderStats.completed})</span>
          </Link>

          {/* باکس لغو شده */}
          <Link href="/dashboard/my-orders" className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-sm font-bold text-gray-700">لغو شده</span>
            <span className="text-xs text-gray-400 mt-1">({orderStats.cancelled})</span>
          </Link>
        </div>
      </div>

      {/* بخش محصولات مورد علاقه */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">محصولات مورد علاقه من</h2>
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
           <p className="text-gray-500 font-medium">هنوز محصولی را لایک نکرده‌اید.</p>
        </div>
      </div>

      {/* بخش محصولات فروشگاه‌های دنبال شده */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">محصولات فروشگاه‌های دنبال شده</h2>
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
           <p className="text-gray-500 font-medium">هنوز فروشگاهی را دنبال نکرده‌اید.</p>
        </div>
      </div>

    </div>
  )
}