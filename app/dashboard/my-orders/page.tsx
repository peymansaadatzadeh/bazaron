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
    if (!session) {
      router.push('/login')
      return
    }

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
      data.forEach((order: any) => {
        const groupId = order.payment_group_id || order.id
        
        if (!groups[groupId]) {
          groups[groupId] = {
            id: groupId,
            date: order.created_at,
            status: order.status,
            totalAmount: 0,
            orders: []
          }
        }
        
        groups[groupId].totalAmount += order.total_amount
        groups[groupId].orders.push(order)
        
        if (order.status === 'pending_payment') groups[groupId].status = 'pending_payment'
        if (order.status === 'paid') groups[groupId].status = 'paid'
      })

      setGroupedOrders(Object.values(groups))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMyOrders()
  }, [router])

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

  const totalShippingCost = selectedGroup 
    ? selectedGroup.orders.reduce((sum: number, o: any) => sum + (o.shipping_cost || 0), 0)
    : 0

  const pureProductsTotal = selectedGroup 
    ? selectedGroup.totalAmount - totalShippingCost
    : 0

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">سفارش‌های من</h1>
          <Link href="/dashboard" className="text-indigo-600 font-bold hover:underline">بازگشت به داشبورد</Link>
        </div>

        {groupedOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500">
            شما هنوز هیچ سفارشی ثبت نکرده‌اید.
          </div>
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
                    
                    return (
                      <tr key={group.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5 text-sm text-gray-700">{date}</td>
                        <td className="p-5 font-mono text-xs text-gray-500">{group.id.split('-')[0].toUpperCase()}</td>
                        <td className="p-5 font-bold text-gray-800">{group.totalAmount.toLocaleString()} <span className="text-xs font-normal text-gray-400">تومان</span></td>
                        <td className="p-5">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.color}`}>{statusInfo.text}</span>
                        </td>
                        <td className="p-5 text-center flex justify-center gap-2">
                          <button 
                            onClick={() => setSelectedGroup(group)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                              isPendingPayment 
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isPendingPayment ? 'بررسی و پرداخت' : 'نمایش جزئیات'}
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

      {/* پاپ‌آپ دو ستونه */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
            
            {/* هدر فاکتور */}
            <div className="bg-white px-5 py-3 border-b flex justify-between items-center z-10 shrink-0 shadow-sm">
              <div>
                <h3 className="font-bold text-lg text-gray-800">جزئیات فاکتور</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                  <span>کد: {selectedGroup.id.split('-')[0].toUpperCase()}</span>
                  <span className="w-px h-3 bg-gray-300"></span>
                  <span>{new Date(selectedGroup.date).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {/* بدنه دو ستونه */}
            <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
              
              {/* ستون محصولات (سمت راست) */}
              <div className="w-full md:w-2/3 p-3 overflow-y-auto space-y-3 bg-gray-50">
                {selectedGroup.orders.map((order: any) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-700 text-xs">غرفه:</span>
                        <Link href={`/store/${order.store_id}`} className="font-bold text-gray-800 text-sm hover:underline">
                          {order.stores?.name}
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      {order.order_items.map((item: any) => {
                        const isOutOfStock = item.item_status === 'out_of_stock';
                        return (
                          <div key={item.id} className={`grid grid-cols-[40px_1fr_50px_80px_100px] items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0 transition-colors ${isOutOfStock ? 'bg-red-50/40' : 'hover:bg-gray-50/50'}`}>
                            
                            <Link href={`/product/${item.product_id}`} className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                              {item.products?.image_url ? (
                                <img src={item.products.image_url} alt={item.product_title} className={`w-full h-full object-cover transition-transform hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}`} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">عکس</div>
                              )}
                            </Link>
                            
                            <div className="flex flex-col">
                              <Link href={`/product/${item.product_id}`} className={`font-bold text-xs truncate transition-colors ${isOutOfStock ? 'text-gray-400 line-through' : 'text-gray-800 hover:text-indigo-600'}`}>
                                {item.product_title}
                              </Link>
                              {isOutOfStock && (
                                <span className="text-[9px] text-red-600 font-bold mt-0.5">ناموجود (کسر شد)</span>
                              )}
                            </div>
                            
                            <div className={`w-full text-center text-[10px] font-bold py-1 rounded ${isOutOfStock ? 'bg-red-100 text-red-400' : 'bg-gray-100 text-gray-600'}`}>
                              {item.quantity} عدد
                            </div>
                            
                            <div className={`text-left text-[11px] ${isOutOfStock ? 'line-through text-gray-400' : 'text-gray-400'}`}>
                              {item.unit_price.toLocaleString()}
                            </div>
                            
                            <div className={`text-left font-bold text-sm ${isOutOfStock ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.total_price.toLocaleString()}
                            </div>

                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* ستون خلاصه و پرداخت (سمت چپ) */}
              <div className="w-full md:w-1/3 bg-white border-r border-gray-100 p-5 flex flex-col justify-between shrink-0">
                <div>
                  <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">خلاصه فاکتور</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>مبلغ محصولات:</span>
                      <span className="font-bold text-gray-800">{pureProductsTotal.toLocaleString()} تومان</span>
                    </div>
                    
                    {totalShippingCost > 0 && (
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>هزینه جمع آوری و ارسال:</span>
                        <span className="font-bold text-orange-600">{totalShippingCost.toLocaleString()} تومان</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-800">مبلغ نهایی:</span>
                    <span className="font-black text-xl text-indigo-600">{selectedGroup.totalAmount.toLocaleString()} <span className="text-xs font-normal text-gray-500">تومان</span></span>
                  </div>

                  {selectedGroup.status === 'pending_payment' && (
                    <button 
                      onClick={() => router.push(`/payment/group/${selectedGroup.id}`)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 font-bold text-sm transition-all transform hover:-translate-y-0.5"
                    >
                      تایید و پرداخت
                    </button>
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