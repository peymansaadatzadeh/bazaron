'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function CourierDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const fetchOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from('orders')
      .select(`*, stores(name, phone_number, address, latitude, longitude), order_items(*)`)
      .eq('courier_id', session.user.id)
      .eq('status', 'shipped')
      .order('assigned_at', { ascending: true })

    if (!error && data) {
      const grouped: any = {}
      data.forEach(o => {
        const gid = o.payment_group_id || o.id
        if (!grouped[gid]) {
          grouped[gid] = { id: gid, orders: [], totalShippingFee: 0 }
        }
        grouped[gid].orders.push(o)
      })
      setOrders(Object.values(grouped))
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // ✅ مسیریابی هوشمند
  const handleRouting = (lat: number, lng: number) => {
    if (!lat || !lng) {
      alert('مختصات جغرافیایی این آدرس ثبت نشده است.')
      return
    }
    
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isAndroid) {
      window.open(`geo:${lat},${lng}?q=${lat},${lng}`, '_blank');
    } else if (isIOS) {
      window.open(`maps://?q=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  }

  const handleDeliverGroup = async (group: any) => {
    if (!confirm('آیا مطمئن هستید که تمام بسته‌های این فاکتور را به مشتری تحویل داده‌اید؟')) return
    setProcessing(true)

    try {
      const orderIds = group.orders.map((o: any) => o.id)
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .in('id', orderIds)

      if (error) throw error

      alert('فاکتور با موفقیت تحویل داده شد.')
      fetchOrders() 
    } catch (error: any) {
      alert(`خطا در ثبت تحویل: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری سفارشات...</div>

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800">سفارشات در حال ارسال</h2>
          <p className="text-gray-500 text-sm mt-1">لیست فاکتورهایی که باید جمع‌آوری و تحویل دهید.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">شما در حال حاضر سفارشی برای ارسال ندارید.</h3>
          <p className="text-gray-500">لطفاً منتظر بمانید تا ادمین سفارش جدیدی به شما تخصیص دهد.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((group: any) => (
            <div key={group.id} className="bg-white rounded-3xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                <div>
                  <span className="text-sm text-indigo-600 font-bold block mb-1">کد فاکتور:</span>
                  <span className="font-mono text-lg font-black">{group.id.split('-')[0].toUpperCase()}</span>
                </div>
                <div className="text-left">
                  <span className="text-sm text-gray-600 font-bold block mb-1">مقصد نهایی:</span>
                  <span className="font-bold text-gray-800">{group.orders[0].receiver_name} - {group.orders[0].receiver_phone}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h4 className="font-bold text-gray-800 mb-2">مراحل جمع‌آوری:</h4>
                
                {group.orders.map((order: any, index: number) => {
                  const availableItems = order.order_items.filter((item: any) => item.item_status !== 'out_of_stock');
                  if (availableItems.length === 0) return null;

                  return (
                    <div key={order.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold mb-2 inline-block">غرفه {index + 1}</span>
                          <h5 className="font-bold text-lg text-gray-800">{order.stores?.name}</h5>
                          <p className="text-sm text-gray-500 mt-1">{order.stores?.address || 'آدرس ثبت نشده'}</p>
                          <p className="text-sm font-mono text-gray-600 mt-1" dir="ltr">{order.stores?.phone_number}</p>
                        </div>
                        <button 
                          onClick={() => handleRouting(order.stores?.latitude, order.stores?.longitude)}
                          className="w-full md:w-auto bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          مسیریابی به غرفه
                        </button>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-bold mb-2">اقلامی که باید از این غرفه تحویل بگیرید:</p>
                        <ul className="space-y-1">
                          {availableItems.map((item: any) => (
                            <li key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-gray-100">
                              <span className="font-bold text-gray-700">{item.product_title}</span>
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">{item.quantity} عدد</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                })}

                <div className="bg-green-50 rounded-2xl p-4 border border-green-200 mt-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold mb-2 inline-block">مقصد نهایی (مشتری)</span>
                      <h5 className="font-bold text-lg text-gray-800">تحویل به: {group.orders[0].receiver_name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{group.orders[0].shipping_address}</p>
                    </div>
                    <button 
                      onClick={() => handleRouting(group.orders[0].latitude, group.orders[0].longitude)}
                      className="w-full md:w-auto bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      مسیریابی به مشتری
                    </button>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <button 
                    onClick={() => handleDeliverGroup(group)}
                    disabled={processing}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-lg hover:bg-black disabled:bg-gray-400 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {processing ? 'در حال ثبت...' : 'تایید تحویل به مشتری'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}