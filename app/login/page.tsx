'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`خطا در ورود: ${error.message}`)
      setLoading(false)
    } else {
      setMessage('ورود موفقیت‌آمیز بود! در حال انتقال...')
      setLoading(false)
      router.refresh() // پاک کردن کش
      router.push('/dashboard')
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">ورود به بازار متل قو</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-left" dir="ltr" placeholder="example@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-left" dir="ltr" placeholder="رمز عبور خود را وارد کنید" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors">
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
        {message && <p className={`mt-4 text-center text-sm ${message.includes('خطا') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
        <div className="mt-6 text-center text-sm text-gray-600">
          حساب کاربری ندارید؟ <Link href="/register" className="text-blue-600 hover:underline">ثبت‌نام کنید</Link>
        </div>
      </div>
    </div>
  )
}