'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const [cartData, setCartData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadCart = () => {
    const data = localStorage.getItem('marketplace_cart')
    if (data) {
      setCartData(JSON.parse(data))
    } else {
      setCartData({})
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCart()
  }, [])

  const saveCartToLocalStorage = (newCart: any) => {
    localStorage.setItem('marketplace_cart', JSON.stringify(newCart))
    setCartData(newCart)
  }

  const updateQuantity = (storeId: string, productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    const newCart = { ...cartData }
    const itemIndex = newCart[storeId].items.findIndex((item: any) => item.id === productId)
    if (itemIndex > -1) {
      newCart[storeId].items[itemIndex].quantity = newQuantity
      saveCartToLocalStorage(newCart)
    }
  }

  const removeItem = (storeId: string, productId: string) => {
    const newCart = { ...cartData }
    newCart[storeId].items = newCart[storeId].items.filter((item: any) => item.id !== productId)
    if (newCart[storeId].items.length === 0) {
      delete newCart[storeId]
    }
    saveCartToLocalStorage(newCart)
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  const storeIds = Object.keys(cartData)

  let totalProductsPrice = 0
  storeIds.forEach(storeId => {
    cartData[storeId].items.forEach((item: any) => {
      totalProductsPrice += item.price * item.quantity
    })
  })

  // ✅ کرایه ثابت ۵۰,۰۰۰ تومانی برای همه سفارشات
  const totalShippingFee = 50000;
  const finalTotal = totalProductsPrice + totalShippingFee

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm py-4 mb-8">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-indigo-600 font-bold hover:underline">&rarr; بازگشت به فروشگاه</Link>
          <h1 className="text-xl font-bold text-gray-800">سبد خرید شما</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {storeIds.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl text-gray-600 mb-4">سبد خرید شما خالی است!</h2>
            <Link href="/" className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors">رفتن به فروشگاه</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* ستون سمت راست: لیست فاکتورهای تفکیک‌شده */}
            <div className="w-full lg:w-2/3 space-y-6">
              {storeIds.map((storeId) => {
                const store = cartData[storeId]
                return (
                  <div key={storeId} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-gray-800">غرفه: {store.storeName}</h3>
                      <Link href={`/store/${storeId}`} className="text-sm text-indigo-600 hover:underline font-bold">مشاهده غرفه</Link>
                    </div>
                    <div className="p-4 space-y-4">
                      {store.items.map((item: any) => (
                        <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0 gap-4">
                          <div className="flex-grow">
                            <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.price.toLocaleString()} تومان</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                            <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                              <button onClick={() => updateQuantity(storeId, item.id, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-200 text-lg">+</button>
                              <span className="px-3 py-1 border-x border-gray-200 text-sm font-bold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(storeId, item.id, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-200 text-lg" disabled={item.quantity <= 1}>-</button>
                            </div>
                            <div className="w-24 text-left font-bold text-gray-700 text-sm">{(item.price * item.quantity).toLocaleString()}</div>
                            <button onClick={() => removeItem(storeId, item.id)} className="text-red-500 hover:text-red-700 text-sm font-bold bg-red-50 p-2 rounded-lg transition-colors">حذف</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ستون سمت چپ: باکس پرداخت و قوانین (چسبان) */}
            <div className="w-full lg:w-1/3 bg-white rounded-3xl shadow-lg border-2 border-indigo-100 p-6 sticky top-24">
              
              {/* قوانین ارسال (به‌روزرسانی شده) */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5 text-xs flex flex-col gap-2">
                <span className="text-indigo-800 font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  هزینه ارسال و جمع‌آوری برای تمامی سفارشات، مبلغ ثابت ۵۰,۰۰۰ تومان است.
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">مبلغ محصولات:</span>
                  <span className="font-bold text-gray-800">{totalProductsPrice.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">هزینه ارسال و جمع‌آوری:</span>
                  <span className="font-bold text-orange-600">{totalShippingFee.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-lg border-t border-gray-100 pt-3 mt-1">
                  <span className="text-gray-800 font-bold">مبلغ قابل پرداخت:</span>
                  <span className="font-black text-indigo-600">{finalTotal.toLocaleString()} <span className="text-xs font-normal text-gray-500">تومان</span></span>
                </div>
              </div>
              
              <button 
                onClick={() => router.push(`/checkout?shipping=${totalShippingFee}`)}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4 rounded-2xl hover:shadow-xl hover:shadow-green-500/30 transition-all transform hover:-translate-y-1 font-bold text-lg"
              >
                پرداخت کل سبد خرید
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}