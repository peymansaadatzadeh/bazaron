'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const router = useRouter()

  const fetchReviews = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    // گرفتن نقش کاربر (با maybeSingle برای جلوگیری از خطای Unexpected)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profileError) {
      setMessage(`خطا در بررسی نقش: ${profileError.message}`)
      setLoading(false)
      return
    }

    if (profile?.role !== 'admin') {
      setMessage('شما دسترسی به این صفحه را ندارید. (نقش شما در سیستم ادمین نیست)')
      setLoading(false)
      return
    }

    // گرفتن نظرات
    const { data, error } = await supabase
      .from('reviews')
      .select('*, stores(id, name), products(id, title, store_id)')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`خطای دیتابیس: ${error.message}`)
    } else {
      setReviews(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleUpdateStatus = async (reviewId: string, newStatus: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ status: newStatus })
      .eq('id', reviewId)

    if (error) {
      alert(`خطا در تغییر وضعیت: ${error.message}`)
    } else {
      alert('وضعیت نظر با موفقیت تغییر کرد!')
      fetchReviews()
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('آیا از حذف این نظر مطمئن هستید؟')) return
    
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
    if (error) {
      alert(`خطا در حذف: ${error.message}`)
    } else {
      alert('نظر با موفقیت حذف شد.')
      fetchReviews()
    }
  }

  if (loading) return <div className="p-8 text-center">در حال بارگذاری...</div>
  if (message) return <div className="p-8 text-center text-red-600 font-bold bg-red-50 rounded-xl m-8">{message}</div>

  const filteredReviews = activeTab === 'all' 
    ? reviews 
    : reviews.filter(r => r.status === activeTab)

  const countStatus = (status: string) => reviews.filter(r => r.status === status).length

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">مدیریت نظرات کاربران</h1>
          <Link href="/admin" className="text-blue-600 hover:underline font-bold bg-white px-4 py-2 rounded-full shadow-sm">بازگشت به پنل ادمین</Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
          <button 
            onClick={() => setActiveTab('pending')} 
            className={`px-4 py-2 rounded-t-md font-bold transition-colors ${activeTab === 'pending' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
          >
            در انتظار تایید ({countStatus('pending')})
          </button>
          <button 
            onClick={() => setActiveTab('approved')} 
            className={`px-4 py-2 rounded-t-md font-bold transition-colors ${activeTab === 'approved' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
          >
            تایید شده ({countStatus('approved')})
          </button>
          <button 
            onClick={() => setActiveTab('all')} 
            className={`px-4 py-2 rounded-t-md font-bold transition-colors ${activeTab === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            همه نظرات ({reviews.length})
          </button>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg shadow-sm text-gray-500">
            هیچ نظری در این دسته‌بندی وجود ندارد.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const isProductReview = review.product_id !== null
              const targetStoreId = isProductReview ? review.products?.store_id : review.stores?.id

              return (
                <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-gray-800">
                        {review.reviewer_name || 'کاربر'} 
                      </span>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        {isProductReview ? (
                          <span>نظر برای محصول: <strong className="text-blue-600">{review.products?.title}</strong></span>
                        ) : (
                          <span>نظر برای غرفه: <strong className="text-purple-600">{review.stores?.name}</strong></span>
                        )}
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      review.status === 'approved' ? 'bg-green-100 text-green-700' :
                      review.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {review.status === 'approved' ? 'تایید شده' : review.status === 'pending' ? 'در انتظار تایید' : 'رد شده'}
                    </span>
                  </div>
                  
                  <div className="text-yellow-500 text-lg mb-2" dir="ltr">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  
                  <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg">{review.comment}</p>

                  <div className="flex flex-wrap gap-2 items-center">
                    {review.status !== 'approved' && (
                      <button onClick={() => handleUpdateStatus(review.id, 'approved')} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">تایید و نمایش</button>
                    )}
                    {review.status !== 'rejected' && (
                      <button onClick={() => handleUpdateStatus(review.id, 'rejected')} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors">رد کردن</button>
                    )}
                    <button onClick={() => handleDelete(review.id)} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">حذف کامل</button>
                    
                    {targetStoreId && (
                      <Link href={`/store/${targetStoreId}`} target="_blank" className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors mr-auto">
                        مشاهده {isProductReview ? 'محصول' : 'غرفه'} ↗
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}