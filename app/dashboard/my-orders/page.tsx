'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerOrdersPage() {
  const [groupedOrders, setGroupedOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const router = useRouter()

  const fetchMyOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        stores(id, name),
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
    if (!confirm('آیا کالاهای این فاکتور را دریافت کرده‌اید؟ با این کار امکان ثبت نظر برای محصولات فعال می‌شود.')) return

    try {
      const orderIds = selectedGroup.orders.filter((o: any) => o.status === 'shipped').map((o: any) => o.id)
      if (orderIds.length === 0) { alert('سفارش ارسال‌شده‌ای برای تأیید وجود ندارد.'); return }

      const { data: updatedData, error } = await supabase.from('orders').update({ status: 'delivered' }).in('id', orderIds).select('id')
      if (error) throw error
      if (!updatedData || updatedData.length === 0) throw new Error('سیستم دیتابیس اجازه تغییر وضعیت را نداد (مشکل RLS).')

      alert('دریافت کالا با موفقیت تأیید شد. حالا می‌توانید برای محصولات نظر ثبت کنید.')
      setSelectedGroup(null)
      await fetchMyOrders()
    } catch (error: any) {
      alert(`خطا در تأیید دریافت: ${error.message}`)
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

  // ✅ محاسبه دقیق مبالغ از روی آیتم‌ها
  let pureProductsTotal = 0
  let totalShippingCost = 0
  let deductedAmount = 0
  let outOfStockItems: string[] = []

  if (selectedGroup) {
    selectedGroup.orders.forEach((order: any) => {
      totalShippingCost += (order.shipping_cost || 0)
      order.order_items.forEach((item: any) => {
        if (item.item_status === 'available') {
          pureProductsTotal += item.total_price
        } else if (item.item_status === 'out_of_stock') {
          deductedAmount += item.total_price
          outOfStockItems.push(item.product_title)
        }
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
                            onClick={() => setSelectedGroup(group)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                              isPendingPayment ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 
                              isShipped ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm' : 
                              'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isPendingPayment ? 'بررسی و پرداخت' : isShipped ? 'تأیید دریافت' : 'نمایش جزئیات'}
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

      {selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-white px-5 py-3 border-b flex justify-between items-center z-10 shrink-0 shadow-sm">
              <div>
                <h3 className="font-bold text-lg text-gray-800">فاکتور خرید</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">کد: {selectedGroup.id.split('-')[0].toUpperCase()}</span>
                  <span>{new Date(selectedGroup.date).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
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
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <span className="font-bold text-gray-800 text-sm">{order.stores?.name}</span>
                      </div>
                      <Link href={`/store/${order.store_id}`} className="text-xs text-indigo-600 font-bold hover:underline">مشاهده غرفه</Link>
                    </div>
                    
                    <div className="divide-y divide-gray-50">
                      {order.order_items.map((item: any) => {
                        const isOutOfStock = item.item_status === 'out_of_stock';
                        return (
                          <div key={item.id} className={`p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isOutOfStock ? 'bg-red-50/30' : ''}`}>
                            
                            {/* عکس */}
                            <Link href={`/product/${item.product_id}`} className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border ${isOutOfStock ? 'border-red-100' : 'border-gray-100'}`}>
                              {item.products?.image_url ? (
                                <img src={item.products.image_url} alt={item.product_title} className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-50' : ''}`} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">عکس</div>
                              )}
                            </Link>
                            
                            {/* اطلاعات محصول */}
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="pr-2">
                                  <h4 className={`font-bold text-sm mb-1 ${isOutOfStock ? 'text-red-500 line-through decoration-red-300' : 'text-gray-800'}`}>
                                    {item.product_title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{item.quantity} عدد</span>
                                    {isOutOfStock && (
                                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                                        ناموجود - از فاکتور کسر شد
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* قیمت */}
                                <div className="text-left shrink-0">
                                  {isOutOfStock ? (
                                    <span className="text-sm font-bold text-gray-400 line-through">{item.total_price.toLocaleString()}</span>
                                  ) : item.price_changed ? (
                                    <div className="flex flex-col items-end">
                                      <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded mb-1 border border-orange-100">قیمت اصلاح شد</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 line-through">{item.old_unit_price?.toLocaleString()}</span>
                                        <span className="text-sm font-black text-gray-800">{item.unit_price.toLocaleString()}</span>
                                      </div>
                                      <span className="text-[10px] text-gray-500 mt-0.5">جمع: {item.total_price.toLocaleString()}</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm font-black text-gray-800">{item.unit_price.toLocaleString()}</span>
                                      <span className="text-[10px] text-gray-500 mt-0.5">جمع: {item.total_price.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* ستون خلاصه فاکتور */}
              <div className="w-full md:w-1/3 bg-white border-r border-gray-100 p-6 flex flex-col justify-between shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg mb-4 border-b pb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    خلاصه پرداخت
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>مبلغ کل کالاها:</span>
                      <span className="font-bold text-gray-800">{pureProductsTotal.toLocaleString()} <span className="text-xs font-normal">تومان</span></span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>هزینه ارسال و جمع‌آوری:</span>
                      <span className="font-bold text-orange-600">{totalShippingCost.toLocaleString()} <span className="text-xs font-normal">تومان</span></span>
                    </div>

                    {/* ✅ باکس هشدار کسر مبلغ بابت کالاهای ناموجود */}
                    {deductedAmount > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 leading-relaxed shadow-sm">
                        <div className="flex items-center gap-1 font-bold mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          توجه:
                        </div>
                        مبلغ <span className="font-black">{deductedAmount.toLocaleString()}</span> تومان بابت ناموجود بودن محصولات زیر از فاکتور شما کسر شد:
                        <ul className="list-disc list-inside mt-1 font-bold">
                          {outOfStockItems.map((title, idx) => <li key={idx}>{title}</li>)}
                        </ul>
                      </div>
                    )}

                    {deductedAmount === 0 && (
                      <div className="bg-indigo-50 text-indigo-800 p-3 rounded-xl text-xs leading-relaxed border border-indigo-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mb-0.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        اگر قیمت یا موجودی کالایی تغییر کند، مبلغ نهایی به‌روزرسانی شده و در این بخش نمایش داده می‌شود.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-gray-800">مبلغ قابل پرداخت:</span>
                    <span className="font-black text-2xl text-indigo-600">{finalTotal.toLocaleString()} <span className="text-xs font-normal text-gray-500">تومان</span></span>
                  </div>

                  {selectedGroup.status === 'pending_payment' && (
                    <button onClick={() => router.push(`/payment/group/${selectedGroup.id}`)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 font-bold text-sm transition-all transform hover:-translate-y-0.5">
                      تایید و پرداخت آنلاین
                    </button>
                  )}

                  {selectedGroup.status === 'shipped' && (
                    <button onClick={handleConfirmReceipt} className="w-full bg-gradient-to-r from-teal-600 to-green-600 text-white py-4 rounded-xl hover:shadow-lg hover:shadow-teal-500/30 font-bold text-sm transition-all transform hover:-translate-y-0.5">
                      ✓ تأیید دریافت کالا
                    </button>
                  )}

                  {selectedGroup.status === 'delivered' && (
                    <div className="w-full bg-teal-50 text-teal-700 py-4 rounded-xl font-bold text-sm text-center border border-teal-200 flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      کالا تحویل داده شده
                    </div>
                  )}
                  
                  {selectedGroup.status === 'pending_admin_review' && (
                    <div className="w-full bg-orange-50 text-orange-700 py-4 rounded-xl font-bold text-sm text-center border border-orange-200">
                      در انتظار بررسی موجودی توسط پشتیبانی...
                    </div>
                  )}
                </div>
              </div>
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