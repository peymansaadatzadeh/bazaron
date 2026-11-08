'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// ✅ کامپوننت اصلی که از useSearchParams استفاده می‌کند
function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shippingFee = Number(searchParams.get('shipping')) || 0

  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const data = localStorage.getItem('marketplace_cart')
      if (!data || Object.keys(JSON.parse(data)).length === 0) {
        router.push('/cart')
        return
      }
      setCart(JSON.parse(data))

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (profile) {
          if (profile.full_name) setReceiverName(profile.full_name)
          if (profile.phone_number) setReceiverPhone(profile.phone_number)
          if (profile.address) setShippingAddress(`${profile.city ? profile.city + '، ' : ''}${profile.address}`)
        }
      }
      setLoading(false)
    }
    loadData()
  }, [router])

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setMessage('لطفا ابتدا وارد حساب خود شوید.')
      setSubmitting(false)
      return
    }

    try {
      const paymentGroupId = crypto.randomUUID()
      const storeIds = Object.keys(cart)
      
      let isFirstOrder = true

      for (const storeId of storeIds) {
        const storeData = cart[storeId]
        const subtotal = storeData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        
        const currentShippingFee = isFirstOrder ? shippingFee : 0
        isFirstOrder = false

        const totalAmount = subtotal + currentShippingFee
        const commissionRate = 0.10
        const commissionAmount = subtotal * commissionRate
        const sellerNetAmount = subtotal - commissionAmount

        // ثبت فاکتور با وضعیت "در انتظار بررسی ادمین"
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            customer_id: session.user.id,
            store_id: storeId,
            status: 'pending_admin_review',
            payment_group_id: paymentGroupId,
            subtotal: subtotal,
            shipping_cost: currentShippingFee,
            total_amount: totalAmount,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            seller_net_amount: sellerNetAmount,
            shipping_address: shippingAddress,
            receiver_name: receiverName,
            receiver_phone: receiverPhone
          }]).select().single()

        if (orderError) throw new Error(`خطا در ثبت فاکتور: ${orderError.message}`)

        const itemsToInsert = storeData.items.map((item: any) => ({
          order_id: orderData.id,
          product_id: item.id,
          product_title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          item_status: 'available'
        }))

        const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
        if (itemsError) throw new Error(`خطا در ثبت آیتم‌ها: ${itemsError.message}`)
      }

      // پاک کردن سبد خرید
      localStorage.removeItem('marketplace_cart')

      // نمایش پاپ‌آپ موفقیت
      setShowSuccessModal(true)

    } catch (error: any) {
      setMessage(error.message)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>
  if (!cart) return null

  let totalProductsPrice = 0
  Object.keys(cart).forEach(storeId => {
    cart[storeId].items.forEach((item: any) => { totalProductsPrice += item.price * item.quantity })
  })
  const finalTotal = totalProductsPrice + shippingFee

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8 relative">
      
      {/* پاپ‌آپ موفقیت */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">فاکتور شما ثبت شد</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              فاکتور شما برای استعلام موجودی به پشتیبانی ارسال شد و حداکثر تا نیم ساعت دیگر نتیجه برای شما ارسال می‌شود. لطفاً پنل کاربری خود را چک کنید.
            </p>
            <Link href="/dashboard/my-orders" className="w-full block bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
              مشاهده پنل کاربری و سفارش‌ها
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
        
        <div className="w-full md:w-2/3 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4 border-gray-100">تکمیل اطلاعات ارسال</h1>
          <form onSubmit={handleSubmitOrder} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">نام و نام خانوادگی گیرنده</label>
              <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">شماره تماس</label>
              <input type="text" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">آدرس کامل پستی</label>
              <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required rows={3} className="w-full bg-gray-50 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            
            <div className="pt-4">
              <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl hover:shadow-lg font-bold text-lg disabled:from-gray-300 disabled:to-gray-400 transition-all transform hover:-translate-y-0.5">
                {submitting ? 'در حال ارسال برای بررسی...' : 'ارسال برای بررسی موجودی'}
              </button>
            </div>
            {message && <p className={`text-center mt-4 font-bold p-3 rounded-xl ${message.includes('خطا') ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>{message}</p>}
          </form>
        </div>

        <div className="w-full md:w-1/3 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-28">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800">خلاصه فاکتور</h2>
          <div className="text-sm text-gray-500 mb-4">تعداد غرفه‌ها: {Object.keys(cart).length}</div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">مبلغ محصولات:</span>
              <span className="font-bold">{totalProductsPrice.toLocaleString()}</span>
            </div>
            {shippingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">هزینه پیک:</span>
                <span className="font-bold text-orange-600">{shippingFee.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="border-t pt-4 flex justify-between items-center text-lg font-bold bg-gray-50 p-4 rounded-xl">
            <span className="text-gray-800">مبلغ نهایی:</span>
            <span className="text-indigo-600 text-xl">{finalTotal.toLocaleString()} <span className="text-xs font-normal">تومان</span></span>
          </div>
        </div>

      </div>
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
      `}</style>
    </div>
  )
}

// ✅ خروجی نهایی که کامپوننت را داخل Suspense می‌پیچد
export default function UnifiedCheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <CheckoutContent />
    </Suspense>
  )
}
