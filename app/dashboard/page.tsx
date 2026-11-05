'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase' // مسیر ایمپورت درست برای این پوشه
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('کاربر')
  const [hasStore, setHasStore] = useState(false)
  
  // آمار مشتری
  const [stats, setStats] = useState({
    orders: 0,
    favorites: 0,
    messages: 0
  })

  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // ۱. گرفتن نام کاربر
      const { data: profile } = await supabase.from('profiles').select('full_name, first_name').eq('id', session.user.id).single()
      if (profile?.full_name) setUserName(profile.full_name)
      else if (profile?.first_name) setUserName(profile.first_name)

      // ۲. چک کردن اینکه آیا کاربر غرفه دارد یا نه
      const { data: store } = await supabase.from('stores').select('id').eq('owner_id', session.user.id).maybeSingle()
      if (store) setHasStore(true)

      // ۳. گرفتن آمار مشتری
      // تعداد سفارش‌ها (بر اساس گروه فاکتور)
      const { data: orders } = await supabase.from('orders').select('payment_group_id, id').eq('customer_id', session.user.id)
      const uniqueGroups = new Set(orders?.map(o => o.payment_group_id || o.id))
      
      // تعداد علاقه‌مندی‌ها
      const { count: favCount } = await supabase.from('product_favorites').select('*', { count: 'exact', head: true }).eq('customer_id', session.user.id)
      
      // تعداد پیام‌های دریافتی
      const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', session.user.id)

      setStats({
        orders: uniqueGroups.size,
        favorites: favCount || 0,
        messages: msgCount || 0
      })

      setLoading(false)
    }

    fetchDashboardData()
  }, [router])

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  return (
    <div className="space-y-6">
      
      {/* هدر خوش‌آمدگویی */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 shadow-lg text-white flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black mb-2">سلام {userName} عزیز! 👋</h1>
          <p className="text-indigo-100 text-sm">به پنل کاربری بازار متل قو خوش آمدید. از اینجا می‌توانید فعالیت‌های خود را مدیریت کنید.</p>
        </div>
        
        {/* دکمه ایجاد یا مدیریت فروشگاه */}
        {hasStore ? (
          <Link href="/dashboard/store-panel" className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-md whitespace-nowrap">
            ورود به پنل فروشندگی
          </Link>
        ) : (
          <Link href="/dashboard/create-store" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-md whitespace-nowrap flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            ایجاد فروشگاه جدید
          </Link>
        )}
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* کارت سفارش‌ها */}
        <Link href="/dashboard/my-orders" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-bold">سفارش‌های من</h3>
            <p className="text-2xl font-black text-gray-800">{stats.orders} <span className="text-xs font-normal text-gray-400">فاکتور</span></p>
          </div>
        </Link>

        {/* کارت علاقه‌مندی‌ها */}
        <Link href="/dashboard/favorites" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-bold">علاقه‌مندی‌ها</h3>
            <p className="text-2xl font-black text-gray-800">{stats.favorites} <span className="text-xs font-normal text-gray-400">محصول</span></p>
          </div>
        </Link>

        {/* کارت پیام‌ها */}
        <Link href="/dashboard/messages" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-bold">پیام‌های دریافتی</h3>
            <p className="text-2xl font-black text-gray-800">{stats.messages} <span className="text-xs font-normal text-gray-400">پیام</span></p>
          </div>
        </Link>

      </div>

      {/* بخش لینک‌های سریع */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">دسترسی سریع</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/" className="bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 p-4 rounded-xl font-bold text-sm text-center transition-colors">
            رفتن به فروشگاه
          </Link>
          <Link href="/dashboard/profile" className="bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 p-4 rounded-xl font-bold text-sm text-center transition-colors">
            ویرایش پروفایل
          </Link>
          <Link href="/cart" className="bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 p-4 rounded-xl font-bold text-sm text-center transition-colors">
            سبد خرید
          </Link>
          <Link href="/products" className="bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 p-4 rounded-xl font-bold text-sm text-center transition-colors">
            مشاهده همه محصولات
          </Link>
        </div>
      </div>

    </div>
  )
}