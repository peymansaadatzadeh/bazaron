'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const fetchOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: storeData } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', session.user.id)
      .maybeSingle()

    if (!storeData) {
      setMessage('شما غرفه‌ای ندارید.')
      setLoading(false)
      return
    }

    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('store_id', storeData.id)
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`خطا: ${error.message}`)
    } else {
      setOrders(ordersData || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleApproveStock = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'pending_payment' })
      .eq('id', orderId)

    if (error) {
      alert(`خطا در تایید: ${error.message}`)
    } else {
      alert('سفارش تایید شد و برای پرداخت به مشتری ارجاع داده شد.')
      fetchOrders()
    }
  }

  if (loading) return <div className="p-8 text-center">در حال بارگذاری...</div>
  if (message) return <div className="p-8 text-center text-red-600 font-bold">{message}</div>

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">مدیریت سفارشات</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">بازگشت به داشبورد</Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg shadow-sm text-gray-500">
            هیچ سفارشی برای غرفه شما ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">کد سفارش: </span>
                    <span className="font-mono text-xs">{order.id.split('-')[0]}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    order.status === 'pending_seller' ? 'bg-orange-100 text-orange-700' :
                    order.status === 'pending_payment' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {order.status === 'pending_seller' ? 'در انتظار تایید شما' :
                     order.status === 'pending_payment' ? 'در انتظار پرداخت مشتری' :
                     order.status === 'paid' ? 'پرداخت شده' : order.status}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-2">اطلاعات خریدار:</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    نام: {order.receiver_name} | تلفن: {order.receiver_phone} <br />
                    آدرس: {order.shipping_address}
                  </p>

                  <h3 className="font-bold text-gray-800 mb-2">محصولات:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded">
                    {order.order_items.map((item: any) => (
                      <li key={item.id}>{item.product_title} (تعداد: {item.quantity})</li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center mt-4 border-t pt-4">
                    <span className="font-bold text-lg">مبلغ کل: {order.total_amount.toLocaleString()} تومان</span>
                    
                    {order.status === 'pending_seller' && (
                      <button 
                        onClick={() => handleApproveStock(order.id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                      >
                        تایید موجودی و ارسال برای پرداخت
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}