'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerOrdersPage() {
  const [groupedOrders, setGroupedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  
  // ✅ استیت‌های مربوط به امتیازدهی پیک
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [courierRating, setCourierRating] = useState(0)
  const [courierComment, setCourierComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  const router = useRouter()

  const fetchMyOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        stores(id, name),
        courier:profiles!courier_id (full_name, phone_number),
        order_items (
          *,
          products (image_url)
        )
      `)
      .eq('customer_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const groups: any = {}
      const statusPriority: any = {
        cancelled: 0, pending_admin_review: 1, pending_payment: 2, paid: 3, shipped: 4, delivered: 5
      }

      data.forEach((order: any) => {
        const groupId = order.payment_group_id || order.id
        if (!groups[groupId]) {
          groups[groupId] = { id: groupId, date: order.created_at, status: order.status, orders: [] }
        }
        groups[groupId].orders.push(order)
        
        if ((statusPriority[order.status] ?? 99) < (statusPriority[groups[groupId].status] ?? 99)) {
          groups[groupId].status = order.status
        }
      })

      setGroupedOrders(Object.values(groups))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMyOrders()
  }, [router])

  const handleConfirmReceipt = async () => {
    if (!selectedGroup) return
    if (!confirm('آیا کالاهای این فاکتور را دریافت کرده‌اید؟')) return

    try {
      const orderIds = selectedGroup.orders.filter((o: any) => o.status === 'shipped').map((o: any) => o.id)
      if (orderIds.length === 0) { alert('سفارش ارسال‌شده‌ای برای تأیید وجود ندارد.'); return }

      const { data: updatedData, error } = await supabase.from('orders').update({ status: 'delivered' }).in('id', orderIds).select('id')
      if (error) throw error
      if (!updatedData || updatedData.length === 0) throw new Error('سیستم دیتابیس اجازه تغییر وضعیت را نداد.')

      // ✅ بستن مودال فاکتور و باز کردن مودال امتیازدهی
      setShowRatingModal(true)
      
    } catch (error: any) {
      alert(`خطا در تأیید دریافت: ${error.message}`)
    }
  }

  // ✅ تابع ثبت امتیاز پیک
  const handleSubmitCourierRating = async () => {
    if (courierRating === 0) {
      alert('لطفاً ابتدا با کلیک روی ستاره‌ها، به پیک امتیاز دهید.')
      return
    }
    
    setSubmittingRating(true)
    try {
      const orderIds = selectedGroup.orders.map((o: any) => o.id)
      const { error } = await supabase
        .from('orders')
        .update({ 
          courier_rating: courierRating,
          courier_comment: courierComment
        })
        .in('id', orderIds)

      if (error) throw error
      
      alert('امتیاز شما با موفقیت برای پیک ثبت شد. متشکریم!')
      setShowRatingModal(false)
      setSelectedGroup(null)
      setCourierRating(0)
      setCourierComment('')
      await fetchMyOrders()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmittingRating(false)
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending_admin_review': return { text: 'در انتظار بررسی موجودی', color: 'bg-orange-100 text-orange-700' }
      case 'pending_payment': return { text: 'آماده پرداخت', color: 'bg-blue-100 text-blue-700' }
      case 'paid': return { text: 'پرداخت شده', color: 'bg-green-100 text-green-700' }
      case 'shipped': return { text: 'در حال ارسال', color: 'bg-purple-100 text-purple-700' }
      case 'delivered': return { text: 'تحویل داده شد', color: 'bg-teal-100 text-teal-700' }
      case 'cancelled': return { text: 'لغو شده', color: 'bg-red-100 text-red-700' }
      default: return { text: status, color: 'bg-gray-100 text-gray-700' }
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  // محاسبه مبالغ
  let pureProductsTotal = 0
  let totalShippingCost = 0
  let deductedAmount = 0
  let outOfStockItems: string[] = []

  if (selectedGroup) {
    selectedGroup.orders.forEach((order: any) => {
      totalShippingCost += (order.shipping_cost || 0)
      order.order_items.forEach((item: any) => {
        if (item.item_status === 'available') pureProductsTotal += item.total_price
        else if (item.item_status === 'out_of_stock') { deductedAmount += item.total_price; outOfStockItems.push(item.product_title); }
      })
    })
  }
  const finalTotal = pureProductsTotal + totalShippingCost

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">سفارش‌های من</h1>
          <Link href="/dashboard" className="text-indigo-600 font-bold hover:underline">بازگشت به داشبورد</Link>
        </div>

        {groupedOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500">شما هنوز هیچ سفارشی ثبت نکرده‌اید.</div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <tr>
                    <th className="p-5 font-bold">تاریخ و ساعت</th>
                    <th className="p-5 font-bold">کد فاکتور</th>
                    <th className="p-5 font-bold">مبلغ کل</th>
                    <th className="p-5 font-bold">وضعیت</th>
                    <th className="p-5 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {groupedOrders.map((group) => {
                    const statusInfo = getStatusDisplay(group.status)
                    const date = new Date(group.date).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })
                    const isPendingPayment = group.status === 'pending_payment'
                    const isShipped = group.status === 'shipped'
                    const isDelivered = group.status === 'delivered'
                    
                    // محاسبه مبلغ برای نمایش در جدول
                    let groupTotal = 0;
                    group.orders.forEach((o: any) => {
                      o.order_items.forEach((item: any) => {
                        if (item.item_status === 'available') groupTotal += item.total_price;
                      })
                      groupTotal += (o.shipping_cost || 0);
                    });

                    return (
                      <tr key={group.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5 text-sm text-gray-700">{date}</td>
                        <td className="p-5 font-mono text-xs text-gray-500">{group.id.split('-')[0].toUpperCase()}</td>
                        <td className="p-5 font-bold text-gray-800">{groupTotal.toLocaleString()} <span className="text-xs font-normal text-gray-400">تومان</span></td>
                        <td className="p-5"><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.color}`}>{statusInfo.text}</span></td>
                        <td className="p-5 text-center flex justify-center gap-2">
                          <button 
                            onClick={() => { 
                              setSelectedGroup(group); 
                              setCourierRating(group.orders[0].courier_rating || 0);
                              setCourierComment(group.orders[0].courier_comment || '');
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                              isPendingPayment ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 
                              isShipped ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm' : 
                              isDelivered ? 'bg-gray-800 text-white hover:bg-gray-900 shadow-sm' :
                              'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isPendingPayment ? 'بررسی و پرداخت' : isShipped ? 'تأیید دریافت' : isDelivered ? 'جزئیات و امتیاز' : 'نمایش جزئیات'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* مودال اصلی فاکتور */}
      {selectedGroup && !showRatingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
            
            <div className="bg-white px-5 py-3 border-b flex justify-between items-center z-10 shrink-0 shadow-sm">
              <div>
                <h3 className="font-bold text-lg text-gray-800">فاکتور خرید</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">کد: {selectedGroup.id.split('-')[0].toUpperCase()}</span>
                </div>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row flex-grow overflow-hidden bg-gray-50">
              {/* ستون محصولات */}
              <div className="w-full md:w-2/3 p-4 md:p-6 overflow-y-auto space-y-4">
                {selectedGroup.orders.map((order: any) => (
                  <div key={order.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-sm">{order.stores?.name}</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="p-4 flex gap-4">
                          <div className="flex-grow">
                            <h4 className={`font-bold text-sm ${item.item_status === 'out_of_stock' ? 'text-red-500 line-through' : 'text-gray-800'}`}>{item.product_title}</h4>
                            {item.item_status === 'out_of_stock' && <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded">ناموجود</span>}
                          </div>
                          <span className="font-bold text-sm">{item.total_price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ ستون خلاصه فاکتور با قابلیت اسکرول */}
              <div className="w-full md:w-1/3 bg-white border-r border-gray-100 p-6 flex flex-col justify-between shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] overflow-y-auto">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg mb-4 border-b pb-3">خلاصه پرداخت</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>مبلغ کالاها:</span>
                      <span className="font-bold text-gray-800">{pureProductsTotal.toLocaleString()}</span>
                    </div>
                    {totalShippingCost > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>هزینه ارسال:</span>
                        <span className="font-bold text-orange-600">{totalShippingCost.toLocaleString()}</span>
                      </div>
                    )}
                    {deductedAmount > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                        مبلغ {deductedAmount.toLocaleString()} تومان بابت ناموجودی کسر شد.
                      </div>
                    )}
                  </div>

                  {/* اطلاعات پیک و امتیازدهی در حالت تحویل */}
                  {selectedGroup.status === 'delivered' && selectedGroup.orders[0].courier && (
                    <div className="mt-6 border-t pt-4">
                      <div className="bg-indigo-50 text-indigo-800 p-3 rounded-xl text-xs mb-4 border border-indigo-100 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        این سفارش توسط پیک <strong>{selectedGroup.orders[0].courier.full_name}</strong> تحویل داده شد.
                      </div>

                      {!selectedGroup.orders[0].courier_rating ? (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <p className="text-sm font-bold text-gray-800 mb-3">به پیک امتیاز دهید:</p>
                          <div className="flex gap-1 mb-3" dir="ltr">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button key={star} onClick={() => setCourierRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                                <svg className={`h-8 w-8 ${courierRating >= star ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                          <textarea value={courierComment} onChange={(e) => setCourierComment(e.target.value)} rows={2} placeholder="نظر خود درباره پیک (اختیاری)..." className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none mb-2 resize-none" />
                          <button onClick={handleSubmitCourierRating} disabled={submittingRating} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                            {submittingRating ? 'در حال ثبت...' : 'ثبت امتیاز'}
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-green-700 font-bold bg-green-50 p-2 rounded-lg text-center">
                          شما به این پیک امتیاز {selectedGroup.orders[0].courier_rating} ستاره داده‌اید.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-100 mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-gray-800">مبلغ کل:</span>
                    <span className="font-black text-2xl text-indigo-600">{finalTotal.toLocaleString()} <span className="text-xs font-normal text-gray-500">تومان</span></span>
                  </div>
                  {selectedGroup.status === 'shipped' && (
                    <button onClick={handleConfirmReceipt} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold text-sm">✓ تأیید دریافت</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ مودال اختصاصی امتیازدهی */}
      {showRatingModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-indigo-600 p-6 text-center text-white relative">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-black text-xl mb-1">کالا با موفقیت تحویل شد!</h3>
              <p className="text-indigo-100 text-sm">لطفاً به پیکِ ما امتیاز دهید.</p>
            </div>
            
            <div className="p-6">
              {selectedGroup.orders[0].courier ? (
                <>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl mb-6">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black">
                      {selectedGroup.orders[0].courier.full_name?.charAt(0) || 'پ'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{selectedGroup.orders[0].courier.full_name}</p>
                      <p className="text-xs text-gray-500">پیک ارسال سفارش شما</p>
                    </div>
                  </div>

                  <div className="flex justify-center gap-2 mb-6" dir="ltr">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setCourierRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                        <svg className={`h-10 w-10 ${courierRating >= star ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  <textarea 
                    value={courierComment} 
                    onChange={(e) => setCourierComment(e.target.value)} 
                    rows={2} 
                    placeholder="نظر شما درباره پیک (اختیاری)..." 
                    className="w-full text-sm p-3 rounded-xl border border-gray-200 outline-none mb-4 resize-none focus:ring-2 focus:ring-indigo-500" 
                  />
                  
                  <div className="flex gap-2">
                    <button onClick={handleSubmitCourierRating} disabled={submittingRating} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">
                      {submittingRating ? 'در حال ثبت...' : 'ثبت امتیاز و پایان'}
                    </button>
                    <button 
                      onClick={() => {
                        setShowRatingModal(false);
                        setSelectedGroup(null);
                        fetchMyOrders();
                      }} 
                      className="px-6 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      بعداً
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-6">پیکی برای این سفارش ثبت نشده است.</p>
                  <button 
                    onClick={() => { setShowRatingModal(false); setSelectedGroup(null); fetchMyOrders(); }} 
                    className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
                  >
                    متوجه شدم
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  )
}