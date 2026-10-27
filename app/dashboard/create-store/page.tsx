'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreateStorePage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // بررسی لاگین بودن کاربر
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/login')
    }
    checkUser()
  }, [router])

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // ۱. ساخت غرفه جدید در دیتابیس
    const { error: storeError } = await supabase
      .from('stores')
      .insert([
        {
          owner_id: session.user.id,
          name: name,
          description: description,
          status: 'pending' // در انتظار تایید مدیر
        }
      ])

    if (storeError) {
      setMessage(`خطا در ساخت غرفه: ${storeError.message}`)
      setLoading(false)
      return
    }

    // ۲. تغییر نقش کاربر از مشتری به فروشنده
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'seller' })
      .eq('id', session.user.id)

    if (profileError) {
      setMessage(`خطا در تغییر نقش: ${profileError.message}`)
    } else {
      setMessage('غرفه شما با موفقیت ساخته شد و در انتظار تایید مدیر است!')
      setTimeout(() => router.push('/dashboard'), 2000) // بعد از ۲ ثانیه برگرد به داشبورد
    }
    setLoading(false)
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">ساخت غرفه جدید</h1>
        
        <form onSubmit={handleCreateStore} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام غرفه (فروشگاه)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثلاً: پوشاک علی"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات غرفه</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="درباره فروشگاه خود بنویسید..."
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {loading ? 'در حال ثبت...' : 'ثبت درخواست غرفه'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm ${message.includes('خطا') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}