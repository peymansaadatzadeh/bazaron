'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FavoritesPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // گرفتن همه محصولات لایک شده
      const { data, error } = await supabase
        .from('product_favorites')
        .select('product_id, products(*, stores(name))')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        // استخراج اطلاعات محصولات از داده‌های دریافتی
        const favProducts = data.map((fav: any) => fav.products).filter(Boolean)
        setProducts(favProducts)
      }
      setLoading(false)
    }
    fetchFavorites()
  }, [router])

  // تابع حذف از علاقه‌مندی‌ها (برای اینکه کاربر بتونه از همین صفحه پاک کنه)
  const handleRemoveFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault() // جلوگیری از رفتن به صفحه محصول
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase
      .from('product_favorites')
      .delete()
      .eq('product_id', productId)
      .eq('customer_id', session.user.id)

    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== productId))
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">محصولات مورد علاقه من</h1>
          <Link href="/dashboard" className="text-indigo-600 font-bold hover:underline">بازگشت به داشبورد</Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
             <p className="text-gray-500 font-bold text-lg mb-4">هنوز هیچ محصولی را لایک نکرده‌اید.</p>
             <Link href="/products" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors">مشاهده محصولات</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col transform hover:-translate-y-1">
                <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-grow">
                  <h4 className="font-bold text-gray-800 mb-1 truncate text-base">{product.title}</h4>
                  <p className="text-xs text-gray-500 mb-3">{product.stores?.name}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-black text-indigo-600 text-lg">{product.price.toLocaleString()} <span className="text-xs font-normal">تومان</span></span>
                    
                    {/* دکمه حذف از علاقه‌مندی‌ها */}
                    <button 
                      onClick={(e) => handleRemoveFavorite(e, product.id)}
                      className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-colors"
                      title="حذف از علاقه‌مندی‌ها"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}