'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        setMessage('شما دسترسی به این صفحه را ندارید.')
        setLoading(false)
        return
      }

      const { data: storesData, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setMessage(`خطا در دریافت اطلاعات: ${error.message}`)
      } else {
        setStores(storesData || [])
      }
      setLoading(false)
    }
    checkAdminAndFetch()
  }, [router])

  const handleUpdateStatus = async (storeId: string, newStatus: string) => {
    const { error } = await supabase
      .from('stores')
      .update({ status: newStatus })
      .eq('id', storeId)

    if (error) {
      alert(`خطا در تغییر وضعیت: ${error.message}`)
    } else {
      alert('وضعیت غرفه با موفقیت تغییر کرد!')
      setStores(stores.map(s => s.id === storeId ? { ...s, status: newStatus } : s))
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    )
  }
  if (message) return <div className="p-8 text-center text-red-600 font-bold text-xl mt-20">{message}</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      
      {/* هدر پنل مدیریت */}
      <div className="bg-white border-b border-gray-200 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                پنل مدیریت بازار
              </h1>
              <p className="text-gray-500 mt-2 font-medium">مدیریت غرفه‌ها، سفارشات و نظرات کاربران</p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <Link href="/admin/orders" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 font-bold border border-indigo-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                مدیریت سفارشات
              </Link>
              <Link href="/admin/reviews" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 px-6 py-3 rounded-xl hover:bg-yellow-500 hover:text-white transition-all duration-300 font-bold border border-yellow-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                مدیریت نظرات
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* محتوای جدول */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800">لیست غرفه‌ها</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">{stores.length} غرفه</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-white border-b border-gray-100 text-gray-500 text-sm">
                <tr>
                  <th className="p-5 font-bold">نام غرفه</th>
                  <th className="p-5 font-bold">توضیحات</th>
                  <th className="p-5 font-bold">وضعیت فعلی</th>
                  <th className="p-5 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-400 font-medium">هیچ غرفه‌ای یافت نشد.</td>
                  </tr>
                ) : (
                  stores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                            {store.name.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-800">{store.name}</span>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-500 max-w-xs truncate">{store.description || '-'}</td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          store.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' :
                          store.status === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                          'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {store.status === 'active' ? 'تایید شده' : store.status === 'pending' ? 'در انتظار' : 'رد شده'}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {store.status !== 'active' && (
                            <button onClick={() => handleUpdateStatus(store.id, 'active')} className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-600 hover:text-white transition-all tooltip" title="تایید">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          {store.status !== 'rejected' && (
                            <button onClick={() => handleUpdateStatus(store.id, 'rejected')} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all tooltip" title="رد کردن">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}