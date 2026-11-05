'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function AdminProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const initialTab = searchParams.get('tab') || 'pending_approval'
  const [activeTab, setActiveTab] = useState(initialTab)
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [rejectingProduct, setRejectingProduct] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/admin/products?tab=${tab}`)
  }

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setMessage(`خطای دیتابیس: ${error.message}`)
    else if (data) {
      setProducts(data)
      setMessage('')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleApprove = async (id: string) => {
    if (!confirm('آیا از تایید این محصول مطمئن هستید؟')) return
    
    const { error } = await supabase
      .from('products')
      .update({ status: 'active', rejection_reason: null })
      .eq('id', id)

    if (error) alert(`خطا در تایید: ${error.message}`)
    else {
      alert('محصول با موفقیت تایید شد.')
      fetchProducts()
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalReason = rejectReason === 'other' ? customReason : rejectReason
    if (!finalReason) return alert('لطفا دلیل رد را مشخص کنید.')

    const { error } = await supabase
      .from('products')
      .update({ status: 'rejected', rejection_reason: finalReason })
      .eq('id', rejectingProduct.id)

    if (error) alert(error.message)
    else {
      alert('محصول رد شد و دلیل آن ثبت گردید.')
      setRejectingProduct(null)
      setRejectReason('')
      setCustomReason('')
      fetchProducts()
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری...</div>

  const filteredProducts = products.filter(p => p.status === activeTab)

  const tabs = [
    { id: 'pending_approval', label: 'در انتظار تایید', color: 'bg-orange-500 text-white', inactive: 'bg-orange-50 text-orange-700' },
    { id: 'active', label: 'تایید شده', color: 'bg-green-600 text-white', inactive: 'bg-green-50 text-green-700' },
    { id: 'rejected', label: 'رد شده', color: 'bg-red-600 text-white', inactive: 'bg-red-50 text-red-700' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">مدیریت محصولات</h1>

      {message && <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-4 font-bold">{message}</div>}

      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => handleTabChange(tab.id)} 
            className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === tab.id ? tab.color : tab.inactive + ' hover:opacity-80'}`}
          >
            {tab.label} ({products.filter(p => p.status === tab.id).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
              <tr>
                <th className="p-4 font-bold">عکس</th>
                <th className="p-4 font-bold">نام محصول</th>
                <th className="p-4 font-bold">قیمت</th>
                <th className="p-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500">محصولی در این وضعیت وجود ندارد.</td></tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                        {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <span className="text-[10px] flex h-full items-center justify-center">بدون عکس</span>}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-sm text-gray-800">
                      {product.title}
                      {product.status === 'rejected' && <p className="text-xs text-red-500 mt-1 font-normal">دلیل: {product.rejection_reason}</p>}
                    </td>
                    <td className="p-4 text-sm font-bold">{product.price.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {product.status === 'pending_approval' && (
                          <>
                            <button onClick={() => handleApprove(product.id)} className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-all">تایید</button>
                            <button onClick={() => setRejectingProduct(product)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all">رد کردن</button>
                          </>
                        )}
                        
                        {product.status === 'active' && (
                           <button onClick={() => setRejectingProduct(product)} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 hover:text-white transition-all">رد کردن</button>
                        )}

                        {product.status === 'rejected' && (
                           <button onClick={() => handleApprove(product.id)} className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-all">تایید مجدد</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rejectingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-red-600">رد کردن محصول</h3>
              <button onClick={() => setRejectingProduct(null)} className="text-gray-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-2">دلیل رد کردن محصول «{rejectingProduct.title}» را انتخاب کنید:</p>
              
              <div className="space-y-2">
                {['عکس نامناسب', 'قیمت غیرواقعی', 'توضیحات ناقص', 'تکراری بودن'].map(reason => (
                  <label key={reason} className="flex items-center gap-2 text-sm">
                    <input type="radio" value={reason} checked={rejectReason === reason} onChange={(e) => setRejectReason(e.target.value)} className="w-4 h-4 text-red-600" />
                    {reason}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" value="other" checked={rejectReason === 'other'} onChange={(e) => setRejectReason(e.target.value)} className="w-4 h-4 text-red-600" />
                  دلیل دیگر...
                </label>
              </div>

              {rejectReason === 'other' && (
                <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="دلیل را بنویسید..." className="w-full bg-gray-50 border p-2 rounded-xl text-sm" required />
              )}

              <div className="pt-4 flex gap-2">
                <button type="submit" className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700">ثبت رد و ارسال دلیل</button>
                <button type="button" onClick={() => setRejectingProduct(null)} className="px-4 py-2.5 text-gray-600 font-bold bg-gray-100 rounded-xl">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <AdminProductsContent />
    </Suspense>
  )
}