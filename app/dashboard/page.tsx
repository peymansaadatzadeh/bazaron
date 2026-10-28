'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [role, setRole] = useState<string>('customer')
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      setStore(null)
      setUserEmail(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserEmail(session.user.email ?? null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (profile) setRole(profile.role)

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle()

      if (storeData) {
        setStore(storeData)
      }
      
      setLoading(false)
    }
    fetchUserData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen">در حال بارگذاری...</div>

  return (
    <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
        <h1 className="text-3xl font-bold text-green-600 mb-4">داشبورد</h1>
        <p className="text-gray-700 mb-2">شما با موفقیت وارد شدید!</p>
        <p className="font-mono bg-gray-100 p-2 rounded mb-6 text-sm">{userEmail}</p>
        
        <hr className="my-6" />

        {/* دکمه سفارش‌های من (برای همه) */}
        <div className="mb-6">
          <Link href="/dashboard/my-orders" className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition-colors block w-full font-bold">
            سفارش‌های من
          </Link>
        </div>

        {/* بخش ادمین */}
        {role === 'admin' && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-700 mb-2 font-bold">شما مدیر سیستم هستید</p>
            <Link href="/admin" className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-colors block w-full">
              ورود به پنل مدیریت
            </Link>
          </div>
        )}

        {/* بخش فروشنده */}
        {store ? (
          <div className="mb-6 border-t pt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">غرفه شما: {store.name}</h2>
            <p className="text-gray-600 mb-4">وضعیت: 
              <span className={`font-bold mr-2 ${store.status === 'pending' ? 'text-orange-500' : store.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {store.status === 'pending' ? 'در انتظار تایید مدیر' : store.status === 'active' ? 'تایید شده' : 'رد شده'}
              </span>
            </p>
            
            {store.status === 'active' ? (
              <div className="flex flex-col gap-3">
                <Link href="/dashboard/products" className="bg-gray-800 text-white py-2 px-6 rounded-md hover:bg-gray-900 transition-colors block w-full">
                  مدیریت محصولات غرفه
                </Link>
                <Link href="/dashboard/orders" className="bg-yellow-500 text-white py-2 px-6 rounded-md hover:bg-yellow-600 transition-colors block w-full">
                  مدیریت سفارشات جدید
                </Link>
              </div>
            ) : (
              <button className="bg-gray-300 text-gray-600 py-2 px-6 rounded-md cursor-not-allowed w-full" disabled>
                مدیریت محصولات (پس از تایید غرفه)
              </button>
            )}
          </div>
        ) : (
          <div className="mb-6 border-t pt-6">
            <p className="text-gray-600 mb-4">شما هنوز غرفه‌ای نساخته‌اید.</p>
            <Link href="/dashboard/create-store" className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors block w-full">
              درخواست ساخت غرفه (فروشنده شوید)
            </Link>
          </div>
        )}

        <button onClick={handleLogout} className="bg-red-500 text-white py-2 px-6 rounded-md hover:bg-red-600 transition-colors w-full mt-4">
          خروج از حساب
        </button>
      </div>
    </div>
  )
}