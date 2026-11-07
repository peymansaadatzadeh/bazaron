'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AdminCouriersPage() {
  const router = useRouter()
  
  // ✅ استیت برای تب‌بندی
  const [activeTab, setActiveTab] = useState<'list' | 'reviews'>('list')
  
  const [couriers, setCouriers] = useState<any[]>([])
  const [reviewsData, setReviewsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [showAddModal, setShowAddModal] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedInvoice, setSelectedInvoice] = useState<any[] | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(false)

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    
    setLoading(true)

    // ۱. گرفتن لیست پیک‌ها و وضعیت آن‌ها
    const { data: profilesData } = await supabase.from('profiles').select('*').eq('role', 'courier')
    const { data: activeOrders } = await supabase.from('orders').select('courier_id, payment_group_id, id').eq('status', 'shipped')

    const busyCourierOrders: any = {}
    if (activeOrders) {
      activeOrders.forEach(o => {
        const gid = o.payment_group_id || o.id
        busyCourierOrders[o.courier_id] = { code: gid.split('-')[0].toUpperCase(), fullId: gid }
      })
    }

    const couriersWithStatus = (profilesData || []).map(courier => ({
      ...courier,
      isBusy: !!busyCourierOrders[courier.id],
      activeOrderCode: busyCourierOrders[courier.id]?.code || null,
      activeOrderId: busyCourierOrders[courier.id]?.fullId || null
    }))
    setCouriers(couriersWithStatus)

    // ۲. گرفتن نظرات و امتیازات پیک‌ها
    const { data: reviews } = await supabase
      .from('orders')
      .select(`
        id, courier_rating, courier_comment, delivered_at, courier_id,
        courier:profiles!courier_id (full_name, phone_number),
        customer:profiles!customer_id (full_name, phone_number)
      `)
      .not('courier_rating', 'is', null)
      .order('delivered_at', { ascending: false })

    if (reviews) {
      const grouped: any = {}
      reviews.forEach((order: any) => {
        const cid = order.courier_id
        if (!cid) return
        if (!grouped[cid]) {
          grouped[cid] = {
            courierId: cid,
            courierName: order.courier?.full_name || 'پیک بدون نام',
            courierPhone: order.courier?.phone_number || 'ثبت نشده',
            reviews: [],
            totalRatings: 0,
            averageRating: 0
          }
        }
        grouped[cid].reviews.push(order)
        grouped[cid].totalRatings += order.courier_rating
      })

      const result = Object.values(grouped).map((c: any) => ({
        ...c,
        averageRating: (c.totalRatings / c.reviews.length).toFixed(1)
      }))
      // مرتب‌سازی از ضعیف‌ترین به بهترین
      result.sort((a, b) => Number(a.averageRating) - Number(b.averageRating))
      setReviewsData(result)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [router])

  const handleViewInvoice = async (groupId: string) => {
    setLoadingInvoice(true)
    const { data, error } = await supabase.from('orders').select(`*, stores (name, phone_number, address), order_items (*)`).eq('payment_group_id', groupId)
    if (!error && data) setSelectedInvoice(data)
    else alert('خطا در دریافت اطلاعات فاکتور')
    setLoadingInvoice(false)
  }

  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    if (!/^09\d{9}$/.test(phone)) { setMessage({ type: 'error', text: 'شماره تماس معتبر نیست.' }); setIsSubmitting(false); return }

    try {
      const tempClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
      const { data: authData, error: authError } = await tempClient.auth.signUp({ email, password })
      if (authError) throw new Error(`خطا در ساخت حساب: ${authError.message}`)
      
      const { error: rpcError } = await supabase.rpc('make_user_courier', { p_user_id: authData.user!.id, p_full_name: fullName, p_phone: phone })
      if (rpcError) throw new Error(`خطا در تنظیم پیک: ${rpcError.message}`)

      setMessage({ type: 'success', text: 'پیک جدید با موفقیت استخدام شد.' })
      setShowAddModal(false)
      setFullName(''); setPhone(''); setEmail(''); setPassword('')
      fetchData()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری اطلاعات...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">مدیریت پیک‌ها</h1>
          <p className="text-gray-500 text-sm mt-1">مدیریت ناوگان، وضعیت و ارزیابی پیک‌ها</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setMessage({ type: '', text: '' }); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          استخدام پیک جدید
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-sm border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
          {message.text}
        </div>
      )}

      {/* ✅ تب‌بندی */}
      <div className="flex gap-2 border-b pb-2">
        <button 
          onClick={() => setActiveTab('list')} 
          className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          لیست و وضعیت پیک‌ها
        </button>
        <button 
          onClick={() => setActiveTab('reviews')} 
          className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors flex items-center gap-2 ${activeTab === 'reviews' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          نظرات و امتیازات
          {reviewsData.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{reviewsData.length}</span>}
        </button>
      </div>

      {/* محتوای تب ۱: لیست پیک‌ها */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <tr>
                  <th className="p-5 font-bold">نام پیک</th>
                  <th className="p-5 font-bold">شماره تماس</th>
                  <th className="p-5 font-bold">وضعیت فعلی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {couriers.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-gray-500 font-bold">هنوز هیچ پیکی استخدام نکرده‌اید.</td></tr>
                ) : (
                  couriers.map((courier) => (
                    <tr key={courier.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-5 font-bold text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black">
                            {courier.full_name ? courier.full_name.charAt(0) : 'پ'}
                          </div>
                          {courier.full_name || 'بدون نام'}
                        </div>
                      </td>
                      <td className="p-5 font-mono text-sm text-gray-600" dir="ltr">{courier.phone_number || 'ثبت نشده'}</td>
                      <td className="p-5">
                        {courier.isBusy ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-200">
                              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                              در حال فعالیت (مشغول)
                            </span>
                            <button 
                              onClick={() => handleViewInvoice(courier.activeOrderId)}
                              className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md mt-1 border border-indigo-100 transition-colors flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              فاکتور: {courier.activeOrderCode}
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            آزاد (آماده به کار)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* محتوای تب ۲: نظرات و امتیازات */}
      {activeTab === 'reviews' && (
        <div className="space-y-8">
          {reviewsData.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 font-bold">
              هنوز هیچ نظری برای پیک‌ها ثبت نشده است.
            </div>
          ) : (
            reviewsData.map((courier) => (
              <div key={courier.courierId} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* هدر پیک و میانگین امتیاز */}
                <div className="bg-gray-50 p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xl">
                      {courier.courierName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-gray-800">{courier.courierName}</h2>
                      <p className="text-sm text-gray-500 font-mono mt-0.5" dir="ltr">{courier.courierPhone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-sm text-gray-500 font-bold">میانگین امتیاز:</span>
                    <div className="flex items-center gap-1">
                      <svg className={`h-5 w-5 ${Number(courier.averageRating) >= 3 ? 'text-yellow-400' : 'text-red-400'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className={`font-black text-lg ${Number(courier.averageRating) >= 3 ? 'text-gray-800' : 'text-red-600'}`}>{courier.averageRating}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded-md">از {courier.reviews.length} نظر</span>
                  </div>
                </div>

                {/* لیست نظرات مشتریان */}
                <div className="divide-y divide-gray-50">
                  {courier.reviews.map((review: any) => (
                    <div key={review.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        
                        <div className="flex items-start gap-3 w-full md:w-1/3">
                          <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                            {review.customer?.full_name?.charAt(0) || 'م'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800">{review.customer?.full_name || 'مشتری'}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5" dir="ltr">{review.customer?.phone_number || 'بدون شماره'}</p>
                            <div className="flex gap-0.5 mt-2" dir="ltr">
                              {[1, 2, 3, 4, 5].map(star => (
                                <svg key={star} className={`h-4 w-4 ${review.courier_rating >= star ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-2/3 bg-gray-50 p-3 rounded-xl border border-gray-100 relative">
                          {review.courier_comment ? (
                            <p className="text-sm text-gray-700 leading-relaxed">"{review.courier_comment}"</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">مشتری هیچ متنی ننوشته است.</p>
                          )}
                          <span className="text-[10px] text-gray-400 mt-2 block border-t border-gray-200 pt-1">
                            تاریخ ثبت: {new Date(review.delivered_at || review.created_at).toLocaleDateString('fa-IR')}
                          </span>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* مودال استخدام پیک جدید */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-gray-50 p-5 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">استخدام پیک جدید</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleAddCourier} className="p-6 space-y-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">نام و نام خانوادگی *</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">شماره تماس *</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} maxLength={11} dir="ltr" required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-left focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">ایمیل *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-left focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">رمز عبور *</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" required minLength={6} className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-left focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div className="pt-4 flex gap-2 border-t mt-4">
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">{isSubmitting ? 'در حال ساخت...' : 'ثبت‌نام پیک'}</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال مشاهده فاکتور */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-white p-5 border-b flex justify-between items-center z-10">
              <div><h3 className="font-bold text-lg text-gray-800">جزئیات فاکتور در حال ارسال</h3></div>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4 bg-gray-50">
              <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-4 rounded-2xl text-sm mb-4">
                <h4 className="font-bold text-yellow-900 mb-2">اطلاعات ارسال به مشتری</h4>
                <p>مشتری: <strong>{selectedInvoice[0].receiver_name}</strong> | تلفن: <strong>{selectedInvoice[0].receiver_phone}</strong></p>
                <p className="mt-1">آدرس: {selectedInvoice[0].shipping_address}</p>
              </div>
              {selectedInvoice.map((order: any) => (
                <div key={order.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  <div className="bg-indigo-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center"><span className="font-bold text-indigo-800 text-sm">غرفه: {order.stores?.name}</span></div>
                  <div className="flex flex-col">
                    {order.order_items.filter((item: any) => item.item_status !== 'out_of_stock').map((item: any) => (
                      <div key={item.id} className="grid grid-cols-[1fr_50px] items-center gap-2 p-3 border-b border-gray-50 last:border-0">
                        <div className="font-bold text-sm text-gray-800">{item.product_title}</div>
                        <div className="text-center text-xs bg-gray-100 text-gray-600 font-bold py-1 rounded">{item.quantity} عدد</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 bg-white border-t flex justify-end"><button onClick={() => setSelectedInvoice(null)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">بستن</button></div>
          </div>
        </div>
      )}
    </div>
  )
}