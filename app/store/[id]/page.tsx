'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function StorePage() {
  const params = useParams()
  const storeId = params.id as string

  const [store, setStore] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStoreData = async () => {
      // ۱. گرفتن اطلاعات غرفه
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single()

      if (storeData) {
        setStore(storeData)
      } else {
        setLoading(false)
        return
      }

      // ۲. گرفتن محصولات این غرفه (فقط محصولات فعال)
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (productsData) {
        setProducts(productsData)
      }
      
      setLoading(false)
    }

    if (storeId) {
      fetchStoreData()
    }
  }, [storeId])

  // تابع افزودن به سبد خرید (ذخیره در حافظه مرورگر)
  const handleAddToCart = (product: any) => {
    const existingCartString = localStorage.getItem('marketplace_cart')
    let cartData = existingCartString ? JSON.parse(existingCartString) : {}

    if (!cartData[storeId]) {
      cartData[storeId] = {
        storeName: store.name,
        items: []
      }
    }

    const existingItemIndex = cartData[storeId].items.findIndex((item: any) => item.id === product.id)

    if (existingItemIndex > -1) {
      cartData[storeId].items[existingItemIndex].quantity += 1
    } else {
      cartData[storeId].items.push({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1
      })
    }

    localStorage.setItem('marketplace_cart', JSON.stringify(cartData))
    alert('محصول به سبد خرید این غرفه اضافه شد!')
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen text-xl">در حال بارگذاری غرفه...</div>
  
  if (!store) return <div className="flex justify-center items-center min-h-screen text-xl text-red-600">غرفه مورد نظر یافت نشد!</div>

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm py-4 mb-8">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:underline">&rarr; بازگشت به صفحه اصلی</Link>
          <Link href="/cart" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200">مشاهده سبد خرید</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8 flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-3xl font-bold shrink-0">
            {store.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{store.name}</h2>
            <p className="text-gray-600">{store.description || 'توضیحاتی ثبت نشده است.'}</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4">محصولات این غرفه</h3>
        
        {products.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg shadow-sm text-gray-500">این غرفه هنوز هیچ محصولی ثبت نکرده است.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-400">(بدون تصویر)</div>
                <div className="p-4 flex flex-col flex-grow">
                  <h4 className="font-bold text-gray-800 mb-2 truncate">{product.title}</h4>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-blue-600">{product.price.toLocaleString()} تومان</span>
                      <span className="text-xs text-gray-400">موجودی: {product.stock}</span>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {product.stock === 0 ? 'ناموجود' : 'افزودن به سبد'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}