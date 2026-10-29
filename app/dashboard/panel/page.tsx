'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function SellerDashboardPage() {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalSales: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: storeData } = await supabase.from('stores').select('id').eq('owner_id', session.user.id).single()
      if (!storeData) return

      const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeData.id)
      const { data: oData } = await supabase.from('orders').select('total_amount').eq('store_id', storeData.id).eq('status', 'paid')
      
      const sales = oData?.reduce((sum, o) => sum + o.total_amount, 0) || 0

      setStats({
        totalProducts: pCount || 0,
        totalOrders: oData?.length || 0,
        totalSales: sales
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">در حال بارگذاری آمار...</div>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">پیشخوان فروشگاه</h1>
          <p className="text-gray-500 text-sm mt-1">خلاصه‌ای از عملکرد فروشگاه شما</p>
        </div>
        <Link href="/dashboard/panel/products" className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
          افزودن محصول جدید
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
          <h3 className="text-gray-500 text-sm font-medium">تعداد محصولات</h3>
          <p className="text-3xl font-black text-gray-800 mt-2">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></div>
          <h3 className="text-gray-500 text-sm font-medium">سفارشات موفق</h3>
          <p className="text-3xl font-black text-gray-800 mt-2">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <h3 className="text-gray-500 text-sm font-medium">مجموع فروش</h3>
          <p className="text-3xl font-black text-gray-800 mt-2">{stats.totalSales.toLocaleString()} <span className="text-sm font-normal text-gray-400">تومان</span></p>
        </div>
      </div>
    </div>
  )
}