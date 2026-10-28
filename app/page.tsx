'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

export default function HomePage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStores = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setStores(data)
      }
      setLoading(false)
    }

    fetchStores()
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-xl">در حال بارگذاری بازار...</div>
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">به بازار ما خوش آمدید</h2>
        <p className="text-gray-600">بهترین غرفه‌ها و محصولات را اینجا پیدا کنید.</p>
      </div>

      {stores.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          هنوز هیچ غرفه‌ای تایید نشده است. (به عنوان مدیر، یک غرفه را تایید کنید تا اینجا نمایش داده شود).
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-32 bg-blue-100 flex items-center justify-center">
                <span className="text-blue-400 text-4xl font-bold">{store.name.charAt(0)}</span>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{store.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {store.description || 'توضیحاتی ثبت نشده است.'}
                </p>
                <Link 
                  href={`/store/${store.id}`} 
                  className="block text-center w-full bg-gray-100 text-gray-800 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  مشاهده غرفه
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}