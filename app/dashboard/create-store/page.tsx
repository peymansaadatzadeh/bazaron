'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateStorePage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // استیت‌های فرم
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [workingDays, setWorkingDays] = useState('')
  const [workingHoursStart, setWorkingHoursStart] = useState('')
  const [workingHoursEnd, setWorkingHoursEnd] = useState('')
  const [globalDiscount, setGlobalDiscount] = useState('')
  const [instagram, setInstagram] = useState('')
  const [telegram, setTelegram] = useState('')

  // استیت لوگو
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // چک کردن اینکه کاربر لاگین باشه و از قبل غرفه نداشته باشه
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', session.user.id)
        .maybeSingle()

      if (existingStore) {
        router.push('/dashboard') // اگر از قبل غرفه دارد، برگرد به داشبورد
        return
      }
      setLoading(false)
    }
    checkUser()
  }, [router])

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let logoUrl = ''

    // ۱. آپلود لوگو (اگر انتخاب شده باشد)
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('store-logos')
        .upload(fileName, logoFile)

      if (uploadError) {
        setMessage(`خطا در آپلود لوگو: ${uploadError.message}`)
        setSubmitting(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('store-logos')
        .getPublicUrl(fileName)
      
      logoUrl = publicUrl
    }

    // ۲. ساخت غرفه در دیتابیس
    const { error: storeError } = await supabase
      .from('stores')
      .insert([
        {
          owner_id: session.user.id,
          name: name,
          description: description,
          logo_url: logoUrl,
          phone_number: phoneNumber,
          address: address,
          working_days: workingDays,
          working_hours_start: workingHoursStart,
          working_hours_end: workingHoursEnd,
          global_discount: globalDiscount ? Number(globalDiscount) : 0,
          status: 'pending'
          // نکته: فیلدهای اینستاگرام و تلگرام رو فعلاً تو دیتابیس نداریم، 
          // اگر خواستی بعداً اضافه می‌کنیم. فعلاً تو توضیحات می‌تونه بنویسه.
        }
      ])

    if (storeError) {
      setMessage(`خطا در ساخت غرفه: ${storeError.message}`)
      setSubmitting(false)
      return
    }

    // ۳. تغییر نقش کاربر به فروشنده
    await supabase
      .from('profiles')
      .update({ role: 'seller' })
      .eq('id', session.user.id)

    setMessage('غرفه شما با موفقیت ساخته شد و در انتظار تایید مدیر است!')
    setTimeout(() => {
      router.push('/dashboard')
    }, 3000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* هدر فرم */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-center">
            <h1 className="text-3xl font-black text-white mb-2">همین حالا غرفه خودت رو بساز!</h1>
            <p className="text-indigo-100">با ساخت غرفه، محصولاتت رو به تمام مردم شهر معرفی کن.</p>
          </div>

          <form onSubmit={handleCreateStore} className="p-8 space-y-6">
            
            {/* بخش اول: اطلاعات اصلی */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 border-r-4 border-indigo-500 pr-2">اطلاعات اصلی</h2>
              
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* آپلود لوگو */}
                <div className="w-full md:w-1/3 flex flex-col items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="w-24 h-24 bg-white rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-3 overflow-hidden">
                    {logoFile ? (
                      <img src={URL.createObjectURL(logoFile)} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                    ref={fileInputRef}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-all cursor-pointer" 
                  />
                </div>

                {/* نام و توضیحات */}
                <div className="w-full md:w-2/3 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">نام غرفه (فروشگاه) *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="مثلاً: پوشاک پیمان" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">توضیحات غرفه</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="درباره فروشگاه خود بنویسید..."></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* بخش دوم: اطلاعات تماس و آدرس */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 border-r-4 border-indigo-500 pr-2">اطلاعات تماس و آدرس</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">شماره تماس غرفه *</label>
                  <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left" dir="ltr" placeholder="09123456789" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">آدرس دقیق مغازه</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="خیابان اصلی، پلاک ۱۲" />
                </div>
              </div>
            </div>

            {/* بخش سوم: ساعت کاری */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 border-r-4 border-indigo-500 pr-2">ساعت کاری</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">روزهای کاری</label>
                  <input type="text" value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="مثلاً: شنبه تا پنجشنبه" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">از ساعت</label>
                  <input type="text" value={workingHoursStart} onChange={(e) => setWorkingHoursStart(e.target.value)} className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left" dir="ltr" placeholder="08:00" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">تا ساعت</label>
                  <input type="text" value={workingHoursEnd} onChange={(e) => setWorkingHoursEnd(e.target.value)} className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left" dir="ltr" placeholder="20:00" />
                </div>
              </div>
            </div>

            {/* بخش چهارم: تخفیف */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 border-r-4 border-indigo-500 pr-2">تخفیف ویژه (اختیاری)</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">تخفیف کل روی تمام محصولات (%)</label>
                  <input type="number" value={globalDiscount} onChange={(e) => setGlobalDiscount(e.target.value)} min="0" max="100" className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left text-green-600 font-bold" dir="ltr" placeholder="مثلاً 10" />
                  <p className="text-xs text-gray-400 mt-1">اگر این را پر کنید، روی همه محصولات این غرفه تخفیف اعمال می‌شود.</p>
                </div>
              </div>
            </div>

            {/* دکمه ثبت */}
            <div className="pt-6">
              <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:from-gray-300 disabled:to-gray-400 font-bold text-lg transition-all transform hover:-translate-y-0.5">
                {submitting ? 'در حال ساخت غرفه...' : 'ثبت درخواست غرفه'}
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-4 rounded-xl text-center text-sm font-bold ${message.includes('خطا') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}