'use client'

import { useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setMessage(`خطا در ثبت‌نام: ${authError.message}`)
      setLoading(false)
    } else {
      setMessage('ثبت‌نام با موفقیت انجام شد! در حال انتقال...')
      // انتقال مستقیم به صفحه تکمیل اطلاعات
      setTimeout(() => {
        router.push(`/complete-profile?redirect=${encodeURIComponent(redirectUrl || '/dashboard')}`)
      }, 1000)
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white relative z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-800 mb-2">ثبت‌نام</h1>
          <p className="text-gray-500 text-sm">به بازار متل قو خوش آمدید</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ایمیل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left transition-all"
              dir="ltr"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left transition-all"
              dir="ltr"
              placeholder="حداقل ۶ کاراکتر"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:from-gray-300 disabled:to-gray-400 transition-all transform hover:-translate-y-0.5 font-bold text-lg mt-2"
          >
            {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-3 rounded-xl text-center text-sm font-bold ${message.includes('خطا') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-600 border-t border-gray-100 pt-6">
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <Link href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'} className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
            وارد شوید
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <RegisterForm />
    </Suspense>
  )
}