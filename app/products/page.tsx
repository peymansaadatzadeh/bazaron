'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number | null, size?: string }) => {
  const r = rating ? parseFloat(rating.toString()) : 0;
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        if (r >= star) return <svg key={star} className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
        else if (r >= star - 0.5) return <div key={star} className={`relative ${size}`}><svg className={`absolute top-0 left-0 ${size} text-gray-300`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><div className="absolute top-0 left-0 overflow-hidden w-1/2"><svg className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></div></div>;
        else return <svg key={star} className={`${size} text-gray-300`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
      })}
    </div>
  );
};

function ProductsContent() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const router = useRouter()

  // استیت‌های جستجوی لایو
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isTyping, setIsTyping] = useState(false)

  // Debounce (تاخیر هوشمند) برای جستجوی لایو
  useEffect(() => {
    // اگر متن تایپ شده با متن فعلی آدرس یکی بود، کاری نکن
    if (inputValue === searchQuery) return;

    setIsTyping(true)
    const timer = setTimeout(() => {
      if (inputValue.trim()) {
        router.push(`/products?search=${encodeURIComponent(inputValue)}`)
      } else {
        router.push(`/products`)
      }
      setIsTyping(false)
    }, 500) // ۵۰۰ میلی‌ثانیه صبر می‌کند

    return () => clearTimeout(timer)
  }, [inputValue, router, searchQuery])

  // همگام‌سازی ورودی با آدرس (مثلاً وقتی از هدر جستجو می‌شود)
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  const observerTarget = useRef(null)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').eq('type', 'product').eq('is_active', true).is('parent_id', null)
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [])

  const fetchProducts = async (reset = false) => {
    if (reset) {
      setPage(0)
      setProducts([])
      setHasMore(true)
    }
    if (!hasMore && !reset) return
    
    setLoading(reset)
    setLoadingMore(!reset)

    const from = reset ? 0 : page * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    let query = supabase
      .from('products')
      .select('*, stores(name), reviews(rating, status)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }
    
    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory)
    }

    const { data, error } = await query
    
    if (!error && data) {
      if (reset) setProducts(data)
      else setProducts(prev => [...prev, ...data])
      
      if (data.length < ITEMS_PER_PAGE) setHasMore(false)
      else setPage(prev => prev + 1)
    }
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    fetchProducts(true)
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchProducts()
        }
      },
      { threshold: 1.0 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current) }
  }, [hasMore, loading, loadingMore, page])

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {searchQuery ? `نتایج جستجو برای: "${searchQuery}"` : 'همه محصولات'}
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            
            {/* جستجوی لایو */}
            <div className="w-full sm:w-1/2 relative">
              <input 
                type="text" 
                placeholder="جستجو در محصولات..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
              />
              {isTyping ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              <button onClick={() => setSelectedCategory('')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === '' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>همه</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat.name}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>
        ) : products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 font-bold">
            هیچ محصولی با این مشخصات یافت نشد.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const approvedReviews = product.reviews?.filter((r: any) => r.status === 'approved') || []
                const avgRating = approvedReviews.length > 0 ? (approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviews.length).toFixed(1) : null

                return (
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
                      <p className="text-xs text-gray-500 mb-2">{product.stores?.name}</p>
                      
                      <div className="flex items-center gap-2 mb-3">
                        {avgRating ? (
                          <><StarRating rating={parseFloat(avgRating)} /><span className="text-xs text-gray-500">({approvedReviews.length})</span></>
                        ) : (
                          <span className="text-[10px] text-gray-400">بدون امتیاز</span>
                        )}
                      </div>

                      <div className="mt-auto">
                        <div className="flex justify-between items-center">
                          {product.discount_price ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400 line-through">{product.price.toLocaleString()}</span>
                              <span className="font-black text-green-600 text-lg">{product.discount_price.toLocaleString()} <span className="text-xs font-normal">تومان</span></span>
                            </div>
                          ) : (
                            <span className="font-black text-indigo-600 text-lg">{product.price.toLocaleString()} <span className="text-xs font-normal">تومان</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center py-8">
                {loadingMore && <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600"></div>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <ProductsContent />
    </Suspense>
  )
}