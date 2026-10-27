'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const [cartData, setCartData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // تابع لود کردن سبد خرید از حافظه مرورگر
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

  // ذخیره تغییرات در حافظه مرورگر
  const saveCartToLocalStorage = (newCart: any) => {
    localStorage.setItem('marketplace_cart', JSON.stringify(newCart))
    setCartData(newCart)
  }

  // تغییر تعداد محصول
  const updateQuantity = (storeId: string, productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    const newCart = { ...cartData }
    const itemIndex = newCart[storeId].items.findIndex((item: any) => item.id === productId)
    
    if (itemIndex > -1) {
      newCart[storeId].items[itemIndex].quantity = newQuantity
      saveCartToLocalStorage(newCart)
    }
  }

  // حذف محصول از سبد
  const removeItem = (storeId: string, productId: string) => {
    const newCart = { ...cartData }
    newCart[storeId].items = newCart[storeId].items.filter((item: any) => item.id !== productId)
    
    // اگر سبد این غرفه خالی شد، کل غرفه رو از سبد حذف کن
    if (newCart[storeId].items.length === 0) {
      delete newCart[storeId]
    }
    
    saveCartToLocalStorage(newCart)
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen">در حال بارگذاری...</div>

  const storeIds = Object.keys(cartData)

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm py-4 mb-8">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:underline">&rarr; بازگشت به فروشگاه</Link>
          <h1 className="text-xl font-bold text-gray-800">سبد خرید شما</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {storeIds.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg shadow-sm">
            <h2 className="text-2xl text-gray-600 mb-4">سبد خرید شما خالی است!</h2>
            <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              رفتن به فروشگاه
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* چون قانون طلایی ماست، سبد هر غرفه رو جدا نشون میدیم */}
            {storeIds.map((storeId) => {
              const store = cartData[storeId]
              const storeTotal = store.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

              return (
                <div key={storeId} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                  {/* هدر غرفه */}
                  <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">غرفه: {store.storeName}</h3>
                    <Link href={`/store/${storeId}`} className="text-sm text-blue-600 hover:underline">
                      مشاهده غرفه
                    </Link>
                  </div>

                  {/* لیست محصولات این غرفه */}
                  <div className="p-4 space-y-4">
                    {store.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex-grow">
                          <h4 className="font-bold text-gray-800">{item.title}</h4>
                          <p className="text-sm text-gray-500">{item.price.toLocaleString()} تومان</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* کنترل تعداد */}
                          <div className="flex items-center border rounded-md">
                            <button onClick={() => updateQuantity(storeId, item.id, item.quantity + 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-200 text-lg">+</button>
                            <span className="px-3 py-1 border-x">{item.quantity}</span>
                            <button onClick={() => updateQuantity(storeId, item.id, item.quantity - 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-200 text-lg" disabled={item.quantity <= 1}>-</button>
                          </div>
                          
                          {/* قیمت کل این آیتم */}
                          <div className="w-24 text-left font-bold text-gray-700">
                            {(item.price * item.quantity).toLocaleString()}
                          </div>

                          {/* دکمه حذف */}
                          <button onClick={() => removeItem(storeId, item.id)} className="text-red-500 hover:text-red-700 text-sm">
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* فوتر غرفه (جمع کل و دکمه پرداخت مستقل) */}
                  <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
                    <div className="font-bold text-gray-700">
                      جمع کل این غرفه: <span className="text-blue-600 text-lg">{storeTotal.toLocaleString()} تومان</span>
                    </div>
                    <button 
                      onClick={() => alert(`در مرحله بعد، اینجا به درگاه پرداخت برای غرفه ${store.storeName} وصل می‌شود.`)}
                      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      ثبت سفارش این غرفه
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}