'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // ✅ رفرنس برای اسکرول به خطا
  const messageRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [sheba, setSheba] = useState('')
  
  const weekDays = [
    { id: 'sat', label: 'شنبه' }, { id: 'sun', label: 'یکشنبه' }, { id: 'mon', label: 'دوشنبه' },
    { id: 'tue', label: 'سه‌شنبه' }, { id: 'wed', label: 'چهارشنبه' }, { id: 'thu', label: 'پنجشنبه' }, { id: 'fri', label: 'جمعه' }
  ]
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('21:00')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // ✅ اسکرول خودکار هر زمان پیامی (خطا یا موفقیت) نمایش داده شود
  useEffect(() => {
    if (message.text && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [message])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    if (value.length <= 11) setPhone(value)
  }

  const handleDayToggle = (dayId: string) => {
    if (selectedDays.includes(dayId)) setSelectedDays(selectedDays.filter(d => d !== dayId))
    else setSelectedDays([...selectedDays, dayId])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!/^09\d{9}$/.test(phone)) { setMessage({ type: 'error', text: 'شماره تماس معتبر نیست (۱۱ رقم با ۰۹).' }); return }
    const cleanSheba = sheba.replace(/\s/g, '').toUpperCase()
    if (!cleanSheba.startsWith('IR') || cleanSheba.length !== 26) { setMessage({ type: 'error', text: 'فرمت شبا نامعتبر است.' }); return }
    if (selectedDays.length === 0) { setMessage({ type: 'error', text: 'یک روز کاری انتخاب کنید.' }); return }
    if (!logoFile) { setMessage({ type: 'error', text: 'آپلود لوگو الزامی است.' }); return }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('لطفا وارد شوید.')

      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('store-logos').upload(`${session.user.id}/${fileName}`, logoFile)
      if (uploadError) throw new Error(`خطا در آپلود لوگو: ${uploadError.message}`)
      const { data: { publicUrl } } = supabase.storage.from('store-logos').getPublicUrl(`${session.user.id}/${fileName}`)

      const { error: insertError } = await supabase.from('stores').insert([{
        owner_id: session.user.id, name, description, phone_number: phone, address,
        sheba_number: cleanSheba, working_days: selectedDays.join(','), working_hours: `${startTime} - ${endTime}`,
        logo_url: publicUrl, status: 'pending'
      }])
      if (insertError) throw insertError

      setMessage({ type: 'success', text: 'غرفه ثبت شد و در انتظار تایید است.' })
      setTimeout(() => { router.push('/dashboard'); router.refresh() }, 3000)
    } catch (error: any) { 
      setMessage({ type: 'error', text: error.message }) 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-gray-800">ایجاد غرفه جدید</h1>
        </div>
        
        {/* ✅ اتصال رفرنس به کادر پیام */}
        {message.text && (
          <div ref={messageRef} className={`p-4 rounded-xl text-sm font-bold mb-6 shadow-sm border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2">نام غرفه *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">تلفن *</label>
              <input type="tel" value={phone} onChange={handlePhoneChange} required maxLength={11} dir="ltr" className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-left focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="09123456789" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">شبا *</label>
              <input type="text" value={sheba} onChange={(e) => setSheba(e.target.value)} required maxLength={26} dir="ltr" className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-left font-mono focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="IR..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2">آدرس *</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={2} className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2">توضیحات</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3">روزهای کاری *</label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map(day => (
                <button key={day.id} type="button" onClick={() => handleDayToggle(day.id)} className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${selectedDays.includes(day.id) ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{day.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">شروع *</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-center focus:ring-2 focus:ring-indigo-500 outline-none" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">پایان *</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-center focus:ring-2 focus:ring-indigo-500 outline-none" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">لوگو *</label>
            <input type="file" accept="image/*" onChange={(e) => { if (e.target.files) setLogoFile(e.target.files[0]) }} className="w-full bg-gray-50 p-2 rounded-xl border border-gray-200" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">
            {loading ? 'در حال ثبت...' : 'ثبت غرفه'}
          </button>
        </form>
      </div>
    </div>
  )
}