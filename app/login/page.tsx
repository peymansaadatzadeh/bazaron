'use client'

import { useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

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
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('first_name, role').eq('id', session.user.id).single()
        
        let targetUrl = '/dashboard'
        
        if (profile?.role === 'courier') {
          targetUrl = '/courier'
        } else if (!profile?.first_name || profile.first_name === '') {
          targetUrl = '/complete-profile'
        } else if (redirectUrl) {
          targetUrl = decodeURIComponent(redirectUrl)
        }

        // ✅ ریدایرکت قطعی با رفرش کامل مرورگر
        window.location.href = targetUrl
      } else {
        setLoading(false)
        setMessage('خطا در دریافت اطلاعات کاربر.')
      }
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white relative z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-800 mb-2">خوش آمدید</h1>
          <p className="text-gray-500 text-sm">برای ادامه، وارد حساب کاربری خود شوید</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ایمیل</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left transition-all"
                dir="ltr"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رمز عبور</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left transition-all"
                dir="ltr"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:from-gray-300 disabled:to-gray-400 transition-all transform hover:-translate-y-0.5 font-bold text-lg mt-2"
          >
            {loading ? 'در حال ورود...' : 'ورود به حساب'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-3 rounded-xl text-center text-sm font-bold ${message.includes('خطا') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
            {message}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-600 border-t border-gray-100 pt-6">
          حساب کاربری ندارید؟{' '}
          <Link href={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'} className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
            همین حالا ثبت‌نام کنید
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <LoginForm />
    </Suspense>
  )
}