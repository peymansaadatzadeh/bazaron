'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminSellersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const initialTab = searchParams.get('tab') || 'pending'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/admin/sellers?tab=${tab}`)
  }

  const fetchSellers = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('stores')
      .select('*, profiles(full_name, phone_number)')
      .order('created_at', { ascending: false })

    if (error) setMessage(`خطا: ${error.message}`)
    else setSellers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchSellers()
  }, [])

  const handleApprove = async (id: string) => {
    if (!confirm('آیا از تایید این غرفه مطمئن هستید؟')) return
    setProcessing(true)
    const { error } = await supabase.from('stores').update({ status: 'active', is_suspended: false }).eq('id', id)
    if (error) alert(error.message)
    else { alert('غرفه با موفقیت تایید شد.'); fetchSellers(); setSelectedSeller(null); }
    setProcessing(false)
  }

  const handleSuspend = async (id: string) => {
    if (!confirm('آیا از تعلیق این غرفه مطمئن هستید؟')) return
    setProcessing(true)
    const { error } = await supabase.from('stores').update({ is_suspended: true }).eq('id', id)
    if (error) alert(error.message)
    else { alert('غرفه تعلیق شد.'); fetchSellers(); setSelectedSeller(null); }
    setProcessing(false)
  }

  const handleActivate = async (id: string) => {
    if (!confirm('آیا از فعال‌سازی مجدد این غرفه مطمئن هستید؟')) return
    setProcessing(true)
    const { error } = await supabase.from('stores').update({ is_suspended: false }).eq('id', id)
    if (error) alert(error.message)
    else { alert('غرفه فعال‌سازی شد.'); fetchSellers(); setSelectedSeller(null); }
    setProcessing(false)
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری...</div>
  if (message) return <div className="p-8 text-center text-red-600 font-bold bg-red-50 rounded-2xl">{message}</div>

  let filteredSellers = []
  if (activeTab === 'pending') {
    filteredSellers = sellers.filter(s => s.status === 'pending' && !s.is_suspended)
  } else if (activeTab === 'active') {
    filteredSellers = sellers.filter(s => s.status === 'active' && !s.is_suspended)
  } else if (activeTab === 'suspended') {
    filteredSellers = sellers.filter(s => s.is_suspended === true)
  }

  const countStatus = (status: string) => {
    if (status === 'pending') return sellers.filter(s => s.status === 'pending' && !s.is_suspended).length
    if (status === 'active') return sellers.filter(s => s.status === 'active' && !s.is_suspended).length
    if (status === 'suspended') return sellers.filter(s => s.is_suspended === true).length
    return 0
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">مدیریت فروشندگان</h1>

      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        <button onClick={() => handleTabChange('pending')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'pending' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>
          در انتظار تایید ({countStatus('pending')})
        </button>
        <button onClick={() => handleTabChange('active')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'active' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
          غرفه‌های فعال ({countStatus('active')})
        </button>
        <button onClick={() => handleTabChange('suspended')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'suspended' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
          تعلیق شده ({countStatus('suspended')})
        </button>
      </div>

      {filteredSellers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 font-bold">فروشنده‌ای در این وضعیت وجود ندارد.</div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <tr>
                  <th className="p-4 font-bold">غرفه</th>
                  <th className="p-4 font-bold">مالک</th>
                  <th className="p-4 font-bold">تلفن</th>
                  <th className="p-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border shrink-0">
                          {seller.logo_url ? <img src={seller.logo_url} alt={seller.name} className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center font-bold text-gray-400">{seller.name.charAt(0)}</span>}
                        </div>
                        <span className="font-bold text-sm text-gray-800">{seller.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{seller.profiles?.full_name || 'نامشخص'}</td>
                    <td className="p-4 text-sm font-mono text-gray-600" dir="ltr">{seller.phone_number}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => setSelectedSeller(seller)} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors">مشاهده جزئیات</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSeller && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">جزئیات غرفه: {selectedSeller.name}</h3>
              <button onClick={() => setSelectedSeller(null)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden border shadow-sm shrink-0">
                   {selectedSeller.logo_url ? <img src={selectedSeller.logo_url} className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center text-2xl font-bold text-gray-400">{selectedSeller.name.charAt(0)}</span>}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg">{selectedSeller.name}</p>
                  <p className="text-sm text-gray-500">مالک: {selectedSeller.profiles?.full_name || 'نامشخص'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
                <div><span className="text-gray-500 block mb-1">شماره تماس:</span><span className="font-mono font-bold" dir="ltr">{selectedSeller.phone_number}</span></div>
                <div><span className="text-gray-500 block mb-1">شماره شبا:</span><span className="font-mono font-bold" dir="ltr">{selectedSeller.sheba_number || 'ثبت نشده'}</span></div>
                <div className="col-span-2"><span className="text-gray-500 block mb-1">آدرس:</span><span className="font-bold">{selectedSeller.address}</span></div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {activeTab === 'pending' && (
                  <button onClick={() => handleApprove(selectedSeller.id)} disabled={processing} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400">تایید غرفه</button>
                )}
                {activeTab === 'active' && (
                  <button onClick={() => handleSuspend(selectedSeller.id)} disabled={processing} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 disabled:bg-gray-400">تعلیق غرفه</button>
                )}
                {activeTab === 'suspended' && (
                  <button onClick={() => handleActivate(selectedSeller.id)} disabled={processing} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400">فعال‌سازی مجدد</button>
                )}
                <button onClick={() => setSelectedSeller(null)} className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">بستن</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminSellersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <AdminSellersContent />
    </Suspense>
  )
}