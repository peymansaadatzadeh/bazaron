'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function FakePaymentGateway() {
  const params = useParams()
  const paymentGroupId = params.paymentGroupId as string
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [amount, setAmount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const fetchAmount = async () => {
      // گرفتن مبلغ کل از جدول سفارش‌ها
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('payment_group_id', paymentGroupId)
      
      if (error || !data || data.length === 0) {
        setErrorMsg('فاکتور مورد نظر یافت نشد.')
      } else if (data[0].status === 'paid') {
        setErrorMsg('این فاکتور قبلاً پرداخت شده است.')
      } else {
        // جمع زدن مبلغ همه فاکتورهای این گروه (چون هزینه ارسال فقط روی یکی هست)
        const total = data.reduce((sum, order) => sum + order.total_amount, 0)
        setAmount(total)
      }
      setLoading(false)
    }
    fetchAmount()
  }, [paymentGroupId])

  const handlePay = async () => {
    setPaying(true)
    
    setTimeout(async () => {
      // فراخوانی تابع امن دیتابیس برای پرداخت و واریز به کیف پول
      const { error } = await supabase.rpc('process_payment', {
        p_payment_group_id: paymentGroupId
      })

      if (error) {
        alert(`خطا در پرداخت: ${error.message}`)
        setPaying(false)
      } else {
        setSuccess(true)
        setTimeout(() => {
          // استفاده از window.location برای رفرش کامل صفحه و آپدیت شدن وضعیت
          window.location.href = '/dashboard/my-orders'
        }, 2000)
      }
    }, 1500)
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">پرداخت با موفقیت انجام شد</h1>
          <p className="text-gray-600">در حال بازگشت به سایت...</p>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-800 mb-4">{errorMsg}</h1>
          <button onClick={() => window.location.href = '/dashboard/my-orders'} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">بازگشت به سفارش‌ها</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-300">
        <div className="bg-indigo-900 text-white p-6 text-center">
          <h1 className="text-xl font-bold">درگاه پرداخت اینترنتی (شبیه‌سازی)</h1>
          <p className="text-sm mt-1 text-indigo-200">بانک تست</p>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-2">مبلغ قابل پرداخت:</p>
            <p className="text-3xl font-bold text-gray-800">{amount.toLocaleString()} <span className="text-sm font-normal text-gray-500">تومان</span></p>
            <p className="text-xs text-gray-400 mt-2">(این یک درگاه تست است و پولی کسر نمی‌شود)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handlePay}
              disabled={paying}
              className="bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-bold text-lg disabled:bg-gray-400"
            >
              {paying ? 'در حال اتصال...' : 'پرداخت موفق'}
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/my-orders'}
              disabled={paying}
              className="bg-red-50 text-red-700 py-3 rounded-xl hover:bg-red-100 font-bold text-lg"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}