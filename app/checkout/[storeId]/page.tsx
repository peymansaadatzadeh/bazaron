'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const params = useParams()
  const storeId = params.storeId as string
  const router = useRouter()

  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')

  useEffect(() => {
    const loadCart = () => {
      const data = localStorage.getItem('marketplace_cart')
      if (data) {
        const parsedData = JSON.parse(data)
        if (parsedData[storeId]) {
          setCart(parsedData[storeId])
        } else {
          router.push('/cart')
        }
      } else {
        router.push('/cart')
      }
      setLoading(false)
    }
    loadCart()
  }, [storeId, router])

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setMessage('خطا: لطفا ابتدا وارد حساب خود شوید.')
      setSubmitting(false)
      return
    }

    if (!cart || cart.items.length === 0) return

    try {
      const subtotal = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
      const shippingCost = 0 
      const totalAmount = subtotal + shippingCost
      
      const commissionRate = 0.10
      const commissionAmount = totalAmount * commissionRate
      const sellerNetAmount = totalAmount - commissionAmount

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: session.user.id,
          store_id: storeId,
          status: 'pending_seller',
          subtotal: subtotal,
          shipping_cost: shippingCost,
          total_amount: totalAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          seller_net_amount: sellerNetAmount,
          shipping_address: shippingAddress,
          receiver_name: receiverName,
          receiver_phone: receiverPhone
        }])
        .select()
        .single()

      if (orderError) throw new Error(`خطا در ثبت سفارش: ${orderError.message}`)

      const orderItemsToInsert = cart.items.map((item: any) => ({
        order_id: orderData.id,
        product_id: item.id,
        product_title: item.title,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert)

      if (itemsError) throw new Error(`خطا در ثبت آیتم‌ها: ${itemsError.message}`)

      const existingCart = JSON.parse(localStorage.getItem('marketplace_cart') || '{}')
      delete existingCart[storeId]
      localStorage.setItem('marketplace_cart', JSON.stringify(existingCart))

      setMessage('سفارش شما ثبت شد و برای بررسی موجودی به فروشنده ارسال گردید. در حال انتقال...')
      setTimeout(() => {
        router.push('/dashboard') 
      }, 3000)

    } catch (error: any) {
      setMessage(error.message)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center p-8">در حال بارگذاری...</div>
  if (!cart) return null

  const total = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">تکمیل اطلاعات و ثبت سفارش</h1>
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی گیرنده</label>
              <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس</label>
              <input type="text" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} required className="w-full px-3 py-2 border rounded-md text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">آدرس کامل پستی</label>
              <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required rows={3} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-bold text-lg disabled:bg-gray-400">
              {submitting ? 'در حال ثبت...' : 'ثبت نهایی سفارش (ارسال به فروشنده)'}
            </button>
            {message && <p className={`text-center mt-4 font-bold ${message.includes('خطا') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
          </form>
        </div>

        <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800">خلاصه فاکتور غرفه {cart.storeName}</h2>
          <div className="space-y-3 mb-6">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.title} (x{item.quantity})</span>
                <span className="font-bold">{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
            <span>مبلغ قابل پرداخت:</span>
            <span className="text-blue-600">{total.toLocaleString()} تومان</span>
          </div>
        </div>
      </div>
    </div>
  )
}