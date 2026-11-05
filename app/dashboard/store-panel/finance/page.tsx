'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function SellerFinancePage() {
  const [wallet, setWallet] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sheba, setSheba] = useState('')
  const [isSavingSheba, setIsSavingSheba] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()

  // ✅ رفرنس برای اسکرول خودکار
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message.text && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [message])

  const fetchFinanceData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', session.user.id).maybeSingle()
    if (!storeData) { setLoading(false); return }
    setStore(storeData)
    if (storeData.sheba_number) setSheba(storeData.sheba_number)
    const { data: walletData } = await supabase.from('wallets').select('*').eq('store_id', storeData.id).maybeSingle()
    if (walletData) setWallet(walletData)
    const { data: txData } = await supabase.from('wallet_transactions').select('*').eq('store_id', storeData.id).order('created_at', { ascending: false })
    if (txData) setTransactions(txData)
    const { data: wdData } = await supabase.from('withdrawals').select('*').eq('store_id', storeData.id).order('created_at', { ascending: false })
    if (wdData) setWithdrawals(wdData)
    setLoading(false)
  }

  useEffect(() => { fetchFinanceData() }, [router])

  const handleSaveSheba = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return
    const cleanSheba = sheba.replace(/\s/g, '').toUpperCase()
    if (!cleanSheba.startsWith('IR') || cleanSheba.length !== 26) { setMessage({ type: 'error', text: 'فرمت شبا نامعتبر است (IR + ۲۴ رقم).' }); return }
    setIsSavingSheba(true)
    const { error } = await supabase.from('stores').update({ sheba_number: cleanSheba }).eq('id', store.id)
    if (error) setMessage({ type: 'error', text: `خطا: ${error.message}` })
    else { setMessage({ type: 'success', text: 'شبا ثبت شد.' }); fetchFinanceData() }
    setIsSavingSheba(false)
  }

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store || !wallet) return
    if (!store.sheba_number) { setMessage({ type: 'error', text: 'ابتدا شبا را ثبت کنید.' }); return }
    const amount = Number(withdrawAmount)
    if (amount < 50000) { setMessage({ type: 'error', text: 'حداقل تسویه ۵۰,۰۰۰ تومان است.' }); return }
    if (amount > wallet.balance) { setMessage({ type: 'error', text: 'بیشتر از موجودی است.' }); return }
    setIsSubmitting(true)
    const { error } = await supabase.from('withdrawals').insert([{ store_id: store.id, amount: amount, status: 'pending' }])
    if (error) setMessage({ type: 'error', text: `خطا: ${error.message}` })
    else { setMessage({ type: 'success', text: 'درخواست ثبت شد.' }); setWithdrawAmount(''); fetchFinanceData() }
    setIsSubmitting(false)
  }

  if (loading) return <div className="text-center py-20">در حال بارگذاری...</div>
  const currentBalance = wallet ? wallet.balance : 0

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">مدیریت مالی و کیف پول</h1>
      
      {/* ✅ اتصال رفرنس به کادر پیام */}
      {message.text && (
        <div ref={messageRef} className={`p-4 rounded-xl text-sm font-bold mb-6 shadow-sm border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
          {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-green-600 to-teal-700 rounded-3xl p-6 text-white text-center">
            <h2 className="text-sm font-bold mb-2">موجودی کیف پول</h2>
            <p className="text-4xl font-black mb-4">{currentBalance.toLocaleString()} <span className="text-lg font-normal">تومان</span></p>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">ثبت شبا</h3>
            <form onSubmit={handleSaveSheba} className="space-y-4">
              <input type="text" value={sheba} onChange={(e) => setSheba(e.target.value)} disabled={store?.sheba_number} required className="w-full bg-gray-50 px-4 py-3 border rounded-xl text-left font-mono" dir="ltr" placeholder="IR..." />
              {!store?.sheba_number && <button type="submit" disabled={isSavingSheba} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold">ثبت شبا</button>}
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">درخواست تسویه</h3>
            <form onSubmit={handleWithdrawRequest} className="space-y-4">
              <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} min="50000" max={currentBalance} required className="w-full bg-gray-50 px-4 py-3 border rounded-xl text-left font-bold text-lg" dir="ltr" placeholder="مبلغ" />
              <button type="submit" disabled={isSubmitting || currentBalance < 50000 || !store?.sheba_number} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:bg-gray-300">ثبت درخواست</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b bg-gray-50"><h3 className="font-bold text-gray-800">تاریخچه تراکنش‌ها</h3></div>
            {transactions.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">تراکنشی نیست.</div> : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex justify-between items-center">
                    <div><p className="font-bold text-sm">{tx.description}</p><p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString('fa-IR')}</p></div>
                    <span className={`font-black ${tx.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'sale' ? '+' : '-'}{tx.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b bg-gray-50"><h3 className="font-bold text-gray-800">درخواست‌های تسویه</h3></div>
            {withdrawals.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">درخواستی نیست.</div> : (
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {withdrawals.map((wd) => (
                  <div key={wd.id} className="p-4 flex justify-between items-center">
                    <div><p className="font-bold">{wd.amount.toLocaleString()} تومان</p><p className="text-xs text-gray-400">{new Date(wd.created_at).toLocaleDateString('fa-IR')}</p></div>
                    <div>
                      {wd.status === 'pending' && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">در انتظار</span>}
                      {wd.status === 'approved' && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">تایید شد</span>}
                      {wd.status === 'rejected' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">رد شد</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}