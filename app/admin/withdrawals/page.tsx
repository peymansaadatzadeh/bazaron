'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminWithdrawalsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialTab = searchParams.get('tab') || 'pending'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectingW, setRejectingW] = useState<any>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [copied, setCopied] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/admin/withdrawals?tab=${tab}`)
  }

  const fetchWithdrawals = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('withdrawals')
      .select('*, stores(name, sheba_number)')
      .order('created_at', { ascending: false })

    if (!error && data) setWithdrawals(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const handleApprove = async (id: string) => {
    if (!confirm('آیا از تایید این برداشت مطمئن هستید؟ مبلغ از کیف پول فروشنده کسر می‌شود.')) return
    setProcessing(id)

    const { error } = await supabase.rpc('approve_withdrawal', {
      p_withdrawal_id: id,
      p_new_status: 'approved'
    })

    if (error) alert(`خطا: ${error.message}`)
    else {
      alert('درخواست تایید شد و موجودی کیف پول فروشنده کسر گردید.')
      fetchWithdrawals()
    }
    setProcessing(null)
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingW) return
    setProcessing(rejectingW.id)

    const { error } = await supabase.rpc('approve_withdrawal', {
      p_withdrawal_id: rejectingW.id,
      p_new_status: 'rejected',
      p_admin_note: rejectNote || 'رد شده توسط ادمین'
    })

    if (error) alert(`خطا: ${error.message}`)
    else {
      alert('درخواست رد شد.')
      setRejectingW(null)
      setRejectNote('')
      fetchWithdrawals()
    }
    setProcessing(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری...</div>

  const filteredData = withdrawals.filter(w => w.status === activeTab)
  const countStatus = (status: string) => withdrawals.filter(w => w.status === status).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">مدیریت درخواست‌های تسویه</h1>

      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        <button onClick={() => handleTabChange('pending')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'pending' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>
          در انتظار بررسی ({countStatus('pending')})
        </button>
        <button onClick={() => handleTabChange('approved')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'approved' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
          تایید شده ({countStatus('approved')})
        </button>
        <button onClick={() => handleTabChange('rejected')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
          رد شده ({countStatus('rejected')})
        </button>
      </div>

      {filteredData.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 font-bold">درخواستی در این وضعیت وجود ندارد.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((w) => (
            <div key={w.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">غرفه: {w.stores?.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{new Date(w.created_at).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm">{w.amount.toLocaleString()} <span className="text-[10px] font-normal">تومان</span></span>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 mb-0.5">شماره شبا مقصد:</span>
                    <span className="font-mono text-xs font-bold text-gray-800" dir="ltr">{w.stores?.sheba_number || 'ثبت نشده'}</span>
                  </div>
                  {w.stores?.sheba_number && (
                    <button 
                      onClick={() => copyToClipboard(w.stores.sheba_number)}
                      className="bg-white border border-gray-300 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                      title="کپی شماره شبا"
                    >
                      {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      )}
                    </button>
                  )}
                </div>

                {w.admin_note && (
                  <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg mt-2">یادداشت شما: {w.admin_note}</p>
                )}
              </div>

              {activeTab === 'pending' && (
                <div className="flex gap-2 mt-5">
                  <button 
                    onClick={() => handleApprove(w.id)} 
                    disabled={processing === w.id}
                    className="w-1/2 bg-green-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {processing === w.id ? '...' : 'تایید'}
                  </button>
                  <button 
                    onClick={() => setRejectingW(w)} 
                    disabled={processing === w.id}
                    className="w-1/2 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    رد کردن
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectingW && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-red-600">رد درخواست تسویه</h3>
              <button onClick={() => setRejectingW(null)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">لطفاً دلیل رد شدن درخواست را بنویسید:</p>
              <textarea 
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                required
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="دلیل رد..."
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={processing === rejectingW.id} className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700">ثبت رد</button>
                <button type="button" onClick={() => setRejectingW(null)} className="px-4 py-2.5 text-gray-600 font-bold bg-gray-100 rounded-xl">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminWithdrawalsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <AdminWithdrawalsContent />
    </Suspense>
  )
}