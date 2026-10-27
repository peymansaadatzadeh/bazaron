'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [storeId, setStoreId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // فرم محصول
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [description, setDescription] = useState('')
  
  const router = useRouter()

  // تابع گرفتن لیست محصولات از دیتابیس
  const fetchProducts = async (sId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', sId)
      .order('created_at', { ascending: false })
    
    if (data) setProducts(data)
  }

  useEffect(() => {
    const initPage = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // پیدا کردن غرفه فروشنده
      const { data: storeData } = await supabase
        .from('stores')
        .select('id, status')
        .eq('owner_id', session.user.id)
        .maybeSingle()

      if (!storeData || storeData.status !== 'active') {
        router.push('/dashboard') // اگر غرفه ندارد یا تایید نشده، برگرد
        return
      }
      
      setStoreId(storeData.id)
      await fetchProducts(storeData.id)
      setLoading(false)
    }
    initPage()
  }, [router])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!storeId) return

    const { error } = await supabase
      .from('products')
      .insert([
        {
          store_id: storeId,
          title: title,
          description: description,
          price: Number(price),
          stock: Number(stock),
          status: 'active'
        }
      ])

    if (error) {
      setMessage(`خطا در ثبت محصول: ${error.message}`)
    } else {
      setMessage('محصول با موفقیت اضافه شد!')
      setTitle('')
      setPrice('')
      setStock('')
      setDescription('')
      await fetchProducts(storeId) // آپدیت لیست
    }
    setLoading(false)
  }

  if (loading && !storeId) return <div className="p-8 text-center">در حال بارگذاری...</div>

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* بخش فرم افزودن محصول */}
        <div className="w-full md:w-1/3 bg-white p-6 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-bold mb-4 text-gray-800">افزودن محصول جدید</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام محصول</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">قیمت (تومان)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">موجودی</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
              {loading ? 'در حال ثبت...' : 'افزودن محصول'}
            </button>
            {message && <p className={`text-sm text-center mt-2 ${message.includes('خطا') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
          </form>
          <button onClick={() => router.push('/dashboard')} className="mt-4 w-full text-center text-sm text-blue-600 hover:underline">
            بازگشت به داشبورد
          </button>
        </div>

        {/* بخش لیست محصولات */}
        <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">لیست محصولات شما</h2>
          {products.length === 0 ? (
            <p className="text-gray-500 text-center py-8">هنوز هیچ محصولی ثبت نکرده‌اید.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-3">نام محصول</th>
                    <th className="p-3">قیمت</th>
                    <th className="p-3">موجودی</th>
                    <th className="p-3">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{product.title}</td>
                      <td className="p-3">{product.price.toLocaleString()} تومان</td>
                      <td className="p-3">{product.stock}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.status === 'active' ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}