'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

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
      router.refresh() // آپدیت کش
    }
  }

  if (loading) return <div className="p-8 text-center">در حال بارگذاری...</div>
  if (message) return <div className="p-8 text-center text-red-600 font-bold">{message}</div>

  return (
    <div dir="rtl" className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">پنل مدیریت - تایید غرفه‌ها</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">نام غرفه</th>
              <th className="p-4">توضیحات</th>
              <th className="p-4">وضعیت فعلی</th>
              <th className="p-4">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">هیچ غرفه‌ای یافت نشد.</td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-bold">{store.name}</td>
                  <td className="p-4 text-sm text-gray-600">{store.description}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      store.status === 'active' ? 'bg-green-100 text-green-700' :
                      store.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {store.status === 'active' ? 'تایید شده' : store.status === 'pending' ? 'در انتظار' : 'رد شده'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    {store.status !== 'active' && (
                      <button onClick={() => handleUpdateStatus(store.id, 'active')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">تایید</button>
                    )}
                    {store.status !== 'rejected' && (
                      <button onClick={() => handleUpdateStatus(store.id, 'rejected')} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">رد</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}