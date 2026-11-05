'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function CompleteProfileForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      // گرفتن ایمیل از سیستم احراز هویت (فقط برای نمایش در فیلد)
      if (session.user.email) {
        setEmail(session.user.email)
      }

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (data) {
        if (data.first_name) setFirstName(data.first_name)
        if (data.last_name) setLastName(data.last_name)
        if (data.phone_number) setPhone(data.phone_number)
        if (data.address) setAddress(data.address)
        if (data.city) setCity(data.city)
      }
    }
    fetchProfile()
  }, [router])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    if (value.length <= 11) setPhone(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!/^09\d{9}$/.test(phone)) {
      setMessage('شماره موبایل باید ۱۱ رقم بوده و با 09 شروع شود.')
      return
    }

    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const fullName = `${firstName} ${lastName}`.trim()

    // ✅ اصلاح شد: فیلد email از اینجا حذف شد چون در جدول profiles وجود ندارد
    const { error } = await supabase.from('profiles').update({
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone_number: phone,
      address: address,
      city: city,
    }).eq('id', session.user.id)

    if (error) {
      setMessage(`خطا در ذخیره اطلاعات: ${error.message}`)
      setLoading(false)
    } else {
      router.push(redirectUrl)
      router.refresh()
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <div className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">تکمیل اطلاعات کاربری</h1>
          <p className="text-gray-500 text-sm">لطفاً برای استفاده از تمام امکانات سایت، اطلاعات خود را کامل کنید.</p>
        </div>

        {message && (
          <div className="mb-6 p-3 rounded-xl text-center text-sm font-bold bg-red-50 text-red-600">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">نام *</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="مثلاً: علی" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">نام خانوادگی *</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="مثلاً: رضایی" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">شماره موبایل *</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={handlePhoneChange} 
              required 
              maxLength={11}
              className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left font-bold" 
              dir="ltr" 
              placeholder="09123456789" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ایمیل (غیرقابل تغییر)</label>
            <input type="email" value={email} readOnly className="w-full bg-gray-100 px-4 py-3 border border-gray-200 rounded-xl text-gray-500 text-left cursor-not-allowed" dir="ltr" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">شهر</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="مثلاً: متل قو" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">آدرس دقیق (جهت ارسال)</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="خیابان، کوچه، پلاک و واحد..." />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 transition-all font-bold text-lg mt-4"
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره و ورود به سایت'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <CompleteProfileForm />
    </Suspense>
  )
}