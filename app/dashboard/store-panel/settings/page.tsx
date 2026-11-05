'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function StoreSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const messageRef = useRef<HTMLDivElement>(null)

  // استیت‌های فرم
  const [storeId, setStoreId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [sheba, setSheba] = useState('')
  
  // استیت‌های تصاویر
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [currentCover, setCurrentCover] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // روزها و ساعت کاری
  const weekDays = [
    { id: 'sat', label: 'شنبه' }, { id: 'sun', label: 'یکشنبه' }, { id: 'mon', label: 'دوشنبه' },
    { id: 'tue', label: 'سه‌شنبه' }, { id: 'wed', label: 'چهارشنبه' }, { id: 'thu', label: 'پنجشنبه' }, { id: 'fri', label: 'جمعه' }
  ]
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('21:00')

  // تخفیف
  const [categories, setCategories] = useState<any[]>([])
  const [hasDiscount, setHasDiscount] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [discountCategory, setDiscountCategory] = useState('all')
  const [discountDays, setDiscountDays] = useState(1)

  // تعطیلی فروشگاه
  const [isClosed, setIsClosed] = useState(false)
  const [hasClosureDuration, setHasClosureDuration] = useState(false)
  const [closureDuration, setClosureDuration] = useState<number>(1)
  const [closureUnit, setClosureUnit] = useState<'hours' | 'days'>('days')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: cats } = await supabase.from('categories').select('name')
      if (cats) setCategories(cats)

      const { data: store } = await supabase.from('stores').select('*').eq('owner_id', session.user.id).single()
      if (store) {
        setStoreId(store.id)
        setName(store.name || '')
        setDescription(store.description || '')
        setPhone(store.phone_number || '')
        setEmail(store.email || '')
        setAddress(store.address || '')
        setSheba(store.sheba_number || '')
        setCurrentLogo(store.logo_url)
        setCurrentCover(store.cover_url)
        
        if (store.working_days) setSelectedDays(store.working_days.split(','))
        if (store.working_hours) {
          const [start, end] = store.working_hours.split(' - ')
          if (start) setStartTime(start)
          if (end) setEndTime(end)
        }

        if (store.discount_percentage > 0) {
          setHasDiscount(true)
          setDiscountPercentage(store.discount_percentage)
          setDiscountCategory(store.discount_category || 'all')
        }

        if (store.is_suspended) {
          setIsClosed(true)
          if (store.closed_until) {
             setHasClosureDuration(true)
             const diff = new Date(store.closed_until).getTime() - new Date().getTime();
             if (diff > 0) {
               const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
               if (days >= 1) {
                 setClosureDuration(days);
                 setClosureUnit('days');
               } else {
                 const hours = Math.ceil(diff / (1000 * 60 * 60));
                 setClosureDuration(hours);
                 setClosureUnit('hours');
               }
             }
          }
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [router])

  useEffect(() => {
    if (message.text && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [message])

  const handleDayToggle = (dayId: string) => {
    if (selectedDays.includes(dayId)) setSelectedDays(selectedDays.filter(d => d !== dayId))
    else setSelectedDays([...selectedDays, dayId])
  }

  const handleLogoClick = () => {
    if (window.confirm('آیا می‌خواهید لوگوی فروشگاه را تغییر دهید؟')) {
      logoInputRef.current?.click()
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      let logoUrl = currentLogo
      let coverUrl = currentCover

      // آپلود لوگو
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `logo-${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('store-logos').upload(`${storeId}/${fileName}`, logoFile)
        if (uploadError) throw new Error(`خطا در آپلود لوگو: ${uploadError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('store-logos').getPublicUrl(`${storeId}/${fileName}`)
        logoUrl = publicUrl
      }

      // آپلود کاور
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop()
        const fileName = `cover-${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('store-logos').upload(`${storeId}/${fileName}`, coverFile)
        if (uploadError) throw new Error(`خطا در آپلود کاور: ${uploadError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('store-logos').getPublicUrl(`${storeId}/${fileName}`)
        coverUrl = publicUrl
      }

      let discountExpiresAt = null
      if (hasDiscount && discountPercentage > 0) {
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + discountDays)
        discountExpiresAt = expiry.toISOString()
      }

      let closedUntil = null
      if (isClosed && hasClosureDuration) {
        const expiry = new Date()
        if (closureUnit === 'days') {
          expiry.setDate(expiry.getDate() + Number(closureDuration))
        } else {
          expiry.setHours(expiry.getHours() + Number(closureDuration))
        }
        closedUntil = expiry.toISOString()
      }

      const { error } = await supabase.from('stores').update({
        name, description, phone_number: phone, email, address, sheba_number: sheba,
        logo_url: logoUrl,
        cover_url: coverUrl,
        working_days: selectedDays.join(','),
        working_hours: `${startTime} - ${endTime}`,
        is_suspended: isClosed,
        closed_until: isClosed && hasClosureDuration ? closedUntil : null,
        discount_percentage: hasDiscount ? discountPercentage : 0,
        discount_category: hasDiscount ? discountCategory : null,
        discount_expires_at: hasDiscount ? discountExpiresAt : null
      }).eq('id', storeId)

      if (error) throw error

      // ✅ رفع باگ: آپدیت کردن استیت عکس‌ها تا صفحه عکس‌های جدید را به خاطر بسپارد
      setCurrentLogo(logoUrl)
      setCurrentCover(coverUrl)
      setLogoFile(null)
      setCoverFile(null)

      setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد.' })
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری تنظیمات...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800">تنظیمات فروشگاه</h1>
          <p className="text-gray-500 text-sm mt-1">مدیریت اطلاعات، وضعیت و تخفیف‌های غرفه</p>
        </div>
      </div>

      {message.text && (
        <div ref={messageRef} className={`p-4 rounded-xl text-sm font-bold mb-6 shadow-sm border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="w-full h-48 bg-gray-100 relative group cursor-pointer flex items-center justify-center overflow-hidden" onClick={() => coverInputRef.current?.click()}>
            {currentCover || coverFile ? (
              <img src={coverFile ? URL.createObjectURL(coverFile) : currentCover!} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-sm font-bold">برای انتخاب عکس کاور (دیواری) کلیک کنید</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm">تغییر عکس کاور</span>
            </div>
            <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={(e) => { if (e.target.files) setCoverFile(e.target.files[0]) }} />
          </div>

          <div className="px-8 pb-6 relative">
            <div className="absolute -top-16 right-8 w-32 h-32 bg-white rounded-full shadow-lg border-4 border-white z-10 overflow-hidden group cursor-pointer" onClick={handleLogoClick}>
              {currentLogo || logoFile ? (
                <img src={logoFile ? URL.createObjectURL(logoFile) : currentLogo!} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-4xl font-black text-indigo-600">
                  {name.charAt(0) || 'L'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={(e) => { if (e.target.files) setLogoFile(e.target.files[0]) }} />
            <div className="pt-20">
              <h2 className="text-xl font-black text-gray-800">{name || 'نام فروشگاه شما'}</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 border-b pb-4 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800">روزها و ساعات کاری</h2>
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {weekDays.map(day => (
                  <button key={day.id} type="button" onClick={() => handleDayToggle(day.id)} className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-colors ${selectedDays.includes(day.id) ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-gray-200 text-gray-500'}`}>{day.label}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-500">شروع</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-center font-mono text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-500">پایان</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-center font-mono text-sm" dir="ltr" />
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl p-6 shadow-sm border transition-colors space-y-4 ${hasDiscount ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between border-b border-gray-200/50 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDiscount ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">تخفیف سراسری</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {hasDiscount && (
              <div className="space-y-3 animate-fade-in-down">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-900">درصد</label>
                    <input type="number" min="1" max="99" value={discountPercentage} onChange={(e) => setDiscountPercentage(Number(e.target.value))} className="w-full bg-white px-3 py-2 rounded-xl border border-indigo-200 text-center font-bold text-indigo-700 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-900">مدت (روز)</label>
                    <input type="number" min="1" value={discountDays} onChange={(e) => setDiscountDays(Number(e.target.value))} className="w-full bg-white px-3 py-2 rounded-xl border border-indigo-200 text-center font-bold text-indigo-700 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-indigo-900">دسته‌بندی</label>
                  <select value={discountCategory} onChange={(e) => setDiscountCategory(e.target.value)} className="w-full bg-white px-3 py-2 rounded-xl border border-indigo-200 outline-none text-sm">
                    <option value="all">کل محصولات فروشگاه</option>
                    {categories.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className={`rounded-3xl p-6 shadow-sm border transition-colors space-y-4 ${isClosed ? 'bg-red-50/50 border-red-200' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between border-b border-gray-200/50 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isClosed ? 'bg-red-100 text-red-700' : 'bg-gray-50 text-gray-500'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">تعطیلی فروشگاه</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {isClosed && (
              <div className="space-y-4 animate-fade-in-down">
                <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-red-200">
                  <input type="checkbox" checked={hasClosureDuration} onChange={(e) => setHasClosureDuration(e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-gray-300" />
                  <span className="text-sm font-bold text-gray-700">تعیین مدت زمان مشخص برای تعطیلی</span>
                </label>

                {hasClosureDuration && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-red-900">مدت زمان</label>
                      <input type="number" min="1" value={closureDuration} onChange={(e) => setClosureDuration(Number(e.target.value))} className="w-full bg-white px-3 py-2 rounded-xl border border-red-200 text-center font-bold outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-red-900">واحد</label>
                      <select value={closureUnit} onChange={(e) => setClosureUnit(e.target.value as 'hours'|'days')} className="w-full bg-white px-3 py-2 rounded-xl border border-red-200 outline-none text-sm">
                        <option value="days">روز</option>
                        <option value="hours">ساعت</option>
                      </select>
                    </div>
                  </div>
                )}
                <p className="text-xs text-red-600 font-bold bg-red-100 p-2 rounded-lg">اگر مدت زمان مشخص نکنید، فروشگاه «تا اطلاع ثانوی» تعطیل خواهد بود.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 border-b pb-4 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800">اطلاعات پایه و بانکی</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-500">نام غرفه</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-500">تلفن</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} maxLength={11} dir="ltr" className="w-full bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-left outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-500">ایمیل</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className="w-full bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-left outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-500">شماره شبا</label>
                <input type="text" value={sheba} onChange={(e) => setSheba(e.target.value)} dir="ltr" className="w-full bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 text-left font-mono outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-500">آدرس</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-500">توضیحات</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm" />
              </div>
            </div>
          </div>

        </div>

        <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors shadow-md mt-6">
          {saving ? 'در حال ذخیره...' : 'ذخیره تمامی تنظیمات'}
        </button>
      </form>
    </div>
  )
}