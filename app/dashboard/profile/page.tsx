'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // استیت‌های فرم
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (data) {
        if (data.first_name) setFirstName(data.first_name)
        if (data.last_name) setLastName(data.last_name)
        
        // اگر اسم و فامیل جدا نبود، از full_name میخونیم
        if (!data.first_name && data.full_name) {
          const parts = data.full_name.split(' ')
          setFirstName(parts[0] || '')
          setLastName(parts.slice(1).join(' ') || '')
        }

        setPhoneNumber(data.phone_number || '')
        setAddress(data.address || '')
        setCity(data.city || '')
        setPostalCode(data.postal_code || '')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [router])

  // فقط اجازه تایپ عدد در کادر شماره تلفن
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setPhoneNumber(value)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const fullName = `${firstName} ${lastName}`.trim()

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        phone_number: phoneNumber,
        address: address,
        city: city,
        postal_code: postalCode
      })
      .eq('id', session.user.id)

    if (error) {
      setMessage(`خطا در ذخیره اطلاعات: ${error.message}`)
    } else {
      setMessage('اطلاعات شما با موفقیت ذخیره شد.')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-20 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">پروفایل من</h1>
          <Link href="/dashboard" className="text-gray-500 hover:text-indigo-600 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 transition-colors">
            بازگشت به داشبورد
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-800">اطلاعات شخصی و آدرس</h2>
            <p className="text-sm text-gray-500 mt-1">این اطلاعات در زمان خرید به صورت خودکار برای شما پر می‌شود.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نام</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="مثلاً: پیمان"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نام خانوادگی</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="مثلاً: صادق‌زاده"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">شماره تماس</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left"
                dir="ltr"
                maxLength={11}
                placeholder="09123456789"
              />
              <p className="text-xs text-gray-400 mt-1">شماره باید با 09 شروع شده و ۱۱ رقم باشد.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">آدرس کامل پستی</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="خیابان، کوچه، پلاک، واحد..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">شهر</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="مثلاً: متل قو"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">کد پستی (اختیاری)</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left"
                  dir="ltr"
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 px-8 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:from-gray-300 disabled:to-gray-400 transition-all transform hover:-translate-y-0.5 font-bold text-lg"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره اطلاعات'}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold ${message.includes('خطا') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}