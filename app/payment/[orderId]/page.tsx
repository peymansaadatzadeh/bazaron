'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'

export default function FakePaymentGateway() {
  const params = useParams()
  const orderId = params.orderId as string
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderAmount, setOrderAmount] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // گرفتن مبلغ واقعی سفارش هنگام باز شدن صفحه
  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('id', orderId)
        .single()

      if (error || !data) {
        setErrorMsg('سفارش یافت نشد.')
      } else if (data.status === 'paid') {
        setErrorMsg('این سفارش قبلا پرداخت شده است.')
      } else {
        setOrderAmount(data.total_amount)
      }
    }
    fetchOrder()
  }, [orderId])

  const handlePay = async () => {
    setLoading(true)
    setErrorMsg('')
    
    // شبیه‌سازی تاخیر بانک
    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setErrorMsg('شما لاگین نیستید! لطفا وارد شوید.')
        setLoading(false)
        return
      }

      const { error, data } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)
        .eq('status', 'pending_payment') // فقط اگر در وضعیت انتظار پرداخت بود
        .select()

      if (error) {
        setErrorMsg(`خطای دیتابیس: ${error.message}`)
        setLoading(false)
      } else if (data && data.length === 0) {
         setErrorMsg('امکان پرداخت وجود ندارد. وضعیت سفارش تغییر کرده است.')
         setLoading(false)
      } else {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/dashboard/my-orders'
        }, 2000)
      }
    }, 1500)
  }

  const handleCancel = () => {
    window.location.href = '/dashboard/my-orders'
  }

  // حالت موفقیت
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">پرداخت با موفقیت انجام شد</h1>
          <p className="text-gray-600">در حال بازگشت به سایت...</p>
        </div>
      </div>
    )
  }

  // حالت لودینگ اولیه یا خطا
  if (errorMsg && !orderAmount) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-800 mb-4">{errorMsg}</h1>
          <button onClick={() => window.location.href = '/dashboard/my-orders'} className="bg-blue-600 text-white px-6 py-2 rounded-md">
            بازگشت به سفارش‌ها
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-gray-300">
        <div className="bg-blue-800 text-white p-4 text-center">
          <h1 className="text-xl font-bold">درگاه پرداخت اینترنتی (شبیه‌سازی)</h1>
          <p className="text-sm mt-1">بانک تست</p>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-2">مبلغ قابل پرداخت:</p>
            <p className="text-3xl font-bold text-gray-800">
              {orderAmount !== null ? `${orderAmount.toLocaleString()} تومان` : 'در حال دریافت...'}
            </p>
            <p className="text-xs text-gray-400 mt-2">(این یک درگاه تست است و پولی کسر نمی‌شود)</p>
          </div>

          {errorMsg && <p className="text-red-500 text-center mb-4">{errorMsg}</p>}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handlePay}
              disabled={loading || orderAmount === null}
              className="bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-bold text-lg disabled:bg-gray-400"
            >
              {loading ? 'در حال اتصال...' : 'پرداخت موفق'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-red-100 text-red-700 py-3 rounded-md hover:bg-red-200 font-bold text-lg"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}