'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AdminCouriersPage() {
  const router = useRouter()
  const [couriers, setCouriers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [showAddModal, setShowAddModal] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCouriers = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'courier')

    if (profilesError) {
      console.error(profilesError)
      setLoading(false)
      return
    }

    const { data: activeOrders } = await supabase
      .from('orders')
      .select('courier_id')
      .eq('status', 'shipped')

    const busyCourierIds = activeOrders?.map(o => o.courier_id) || []

    const couriersWithStatus = (profilesData || []).map(courier => ({
      ...courier,
      isBusy: busyCourierIds.includes(courier.id)
    }))

    setCouriers(couriersWithStatus)
    setLoading(false)
  }

  useEffect(() => {
    fetchCouriers()
  }, [router])

  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    if (!/^09\d{9}$/.test(phone)) {
      setMessage({ type: 'error', text: 'شماره تماس معتبر نیست (۱۱ رقم با ۰۹).' })
      setIsSubmitting(false)
      return
    }

    try {
      const tempClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      )

      // ساخت حساب
      const { data: authData, error: authError } = await tempClient.auth.signUp({ email, password })
      if (authError) throw new Error(`خطا در ساخت حساب: ${authError.message}`)
      if (!authData.user) throw new Error('شناسه کاربر دریافت نشد.')

      // ✅ استفاده از RPC امن برای تغییر نقش
      const { error: rpcError } = await supabase.rpc('make_user_courier', {
        p_user_id: authData.user.id,
        p_full_name: fullName,
        p_phone: phone
      })

      if (rpcError) throw new Error(`خطا در تنظیم پیک: ${rpcError.message}`)

      setMessage({ type: 'success', text: 'پیک جدید با موفقیت استخدام شد.' })
      setShowAddModal(false)
      setFullName(''); setPhone(''); setEmail(''); setPassword('')
      
      fetchCouriers()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">مدیریت پیک‌ها</h1>
          <p className="text-gray-500 text-sm mt-1">مدیریت ناوگان ارسال و مشاهده وضعیت پیک‌ها</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setMessage({ type: '', text: '' }); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          استخدام پیک جدید
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-sm border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
              <tr>
                <th className="p-5 font-bold">نام پیک</th>
                <th className="p-5 font-bold">شماره تماس</th>
                <th className="p-5 font-bold">وضعیت فعلی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {couriers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-gray-500 font-bold">
                    هنوز هیچ پیکی استخدام نکرده‌اید.
                  </td>
                </tr>
              ) : (
                couriers.map((courier) => (
                  <tr key={courier.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 font-bold text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black">
                          {courier.full_name ? courier.full_name.charAt(0) : 'پ'}
                        </div>
                        {courier.full_name || 'بدون نام'}
                      </div>
                    </td>
                    <td className="p-5 font-mono text-sm text-gray-600" dir="ltr">{courier.phone_number || 'ثبت نشده'}</td>
                    <td className="p-5">
                      {courier.isBusy ? (
                        <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-200">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                          در حال فعالیت (مشغول)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          آزاد (آماده به کار)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-gray-50 p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">استخدام پیک جدید</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddCourier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">نام و نام خانوادگی *</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="مثلاً: رضا محمدی" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">شماره تماس *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} maxLength={11} dir="ltr" required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-left focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="09123456789" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ایمیل (نام کاربری) *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-left focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="courier@example.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رمز عبور *</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" required minLength={6} className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-left focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="حداقل ۶ کاراکتر" />
              </div>

              <div className="pt-4 flex gap-2 border-t mt-4">
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">
                  {isSubmitting ? 'در حال ساخت...' : 'ثبت‌نام پیک'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}