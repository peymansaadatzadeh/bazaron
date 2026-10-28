'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchMyOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), stores(name)')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data)
      }
      setLoading(false)
    }
    fetchMyOrders()
  }, [router])

  if (loading) return <div className="p-8 text-center">در حال بارگذاری...</div>

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">سفارش‌های من</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">بازگشت به داشبورد</Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg shadow-sm text-gray-500">
            شما هنوز هیچ سفارشی ثبت نکرده‌اید.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800">غرفه: {order.stores?.name}</span>
                    <span className="text-sm text-gray-500 mr-4">کد سفارش: {order.id.split('-')[0]}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    order.status === 'pending_seller' ? 'bg-orange-100 text-orange-700' :
                    order.status === 'pending_payment' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {order.status === 'pending_seller' ? 'در انتظار تایید فروشنده' :
                     order.status === 'pending_payment' ? 'در انتظار پرداخت' :
                     order.status === 'paid' ? 'پرداخت شده' : order.status}
                  </div>
                </div>

                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                  <ul className="list-disc list-inside text-sm text-gray-600 bg-gray-50 p-3 rounded w-full md:w-1/2">
                    {order.order_items.map((item: any) => (
                      <li key={item.id}>{item.product_title} (x{item.quantity})</li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-6 w-full md:w-1/2 justify-end">
                    <span className="font-bold text-lg">مبلغ کل: {order.total_amount.toLocaleString()} تومان</span>
                    
                    {order.status === 'pending_payment' && (
                      <button 
                        onClick={() => router.push(`/payment/${order.id}`)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-bold"
                      >
                        پرداخت فاکتور
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