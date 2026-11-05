'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '../../components/ProductCard'

export default function FavoritesPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // گرفتن فیلدهای تخفیف فروشگاه همراه با محصول
      const { data, error } = await supabase
        .from('product_favorites')
        .select('product_id, products(*, stores(name, discount_percentage, discount_expires_at, discount_category))')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const favProducts = data.map((fav: any) => fav.products).filter(Boolean)
        setProducts(favProducts)
      }
      setLoading(false)
    }
    fetchFavorites()
  }, [router])

  const handleRemoveFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault() 
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
              <ProductCard 
                key={product.id} 
                product={product} 
                isFavorite={true} // در این صفحه همه لایک هستند
                onToggleFavorite={handleRemoveFavorite} // کلیک روی قلب، حذف می‌کند
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}