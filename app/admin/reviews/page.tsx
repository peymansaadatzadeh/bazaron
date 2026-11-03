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
    if (!session) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('reviews')
      .select('*, stores(id, name), products(id, title, store_id)')
      .order('created_at', { ascending: false })

    if (error) setMessage(`خطا: ${error.message}`)
    else setReviews(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleUpdateStatus = async (reviewId: string, newStatus: string) => {
    const { error } = await supabase.from('reviews').update({ status: newStatus }).eq('id', reviewId)
    if (error) alert(`خطا: ${error.message}`)
    else { alert('وضعیت نظر تغییر کرد!'); fetchReviews() }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('حذف شود؟')) return
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
    if (error) alert(error.message)
    else fetchReviews()
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری...</div>
  if (message) return <div className="p-8 text-center text-red-600 font-bold bg-red-50 rounded-2xl">{message}</div>

  const filteredReviews = reviews.filter(r => r.status === activeTab)
  const countStatus = (status: string) => reviews.filter(r => r.status === status).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">مدیریت نظرات کاربران</h1>

      {/* تب‌ها - "همه نظرات" حذف شد */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        <button onClick={() => setActiveTab('pending')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'pending' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>
          در انتظار تایید ({countStatus('pending')})
        </button>
        <button onClick={() => setActiveTab('approved')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'approved' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
          تایید شده ({countStatus('approved')})
        </button>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 font-bold">نظری در این وضعیت وجود ندارد.</div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const isProductReview = review.product_id !== null
            const targetStoreId = isProductReview ? review.products?.store_id : review.stores?.id

            return (
              <div key={review.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-gray-800 text-sm">{review.reviewer_name || 'کاربر'}</span>
                    <div className="text-xs text-gray-600 mt-1">
                      {isProductReview ? (
                        <span>نظر برای محصول: <strong className="text-blue-600">{review.products?.title}</strong></span>
                      ) : (
                        <span>نظر برای غرفه: <strong className="text-purple-600">{review.stores?.name}</strong></span>
                      )}
                    </div>
                  </div>
                  <div className="text-yellow-500 text-sm" dir="ltr">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded-xl text-sm">{review.comment}</p>

                <div className="flex flex-wrap gap-2 items-center">
                  {review.status !== 'approved' && (
                    <button onClick={() => handleUpdateStatus(review.id, 'approved')} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700">تایید</button>
                  )}
                  {review.status !== 'rejected' && (
                    <button onClick={() => handleUpdateStatus(review.id, 'rejected')} className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600">رد کردن</button>
                  )}
                  <button onClick={() => handleDelete(review.id)} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700">حذف</button>
                  
                  {targetStoreId && (
                    <Link href={`/store/${targetStoreId}`} target="_blank" className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 mr-auto">
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
  )
}