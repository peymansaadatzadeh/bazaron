'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'
import ProductCard from '../components/ProductCard'

function ProductsContent() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const router = useRouter()

  const [inputValue, setInputValue] = useState(searchQuery)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (inputValue === searchQuery) return;
    setIsTyping(true)
    const timer = setTimeout(() => {
      if (inputValue.trim()) router.push(`/products?search=${encodeURIComponent(inputValue)}`)
      else router.push(`/products`)
      setIsTyping(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [inputValue, router, searchQuery])

  useEffect(() => { setInputValue(searchQuery) }, [searchQuery])

  const observerTarget = useRef(null)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        const { data: favs } = await supabase.from('product_favorites').select('product_id').eq('customer_id', session.user.id)
        if (favs) setFavoriteIds(favs.map(f => f.product_id))
      }

      const { data } = await supabase.from('categories').select('*').eq('type', 'product').eq('is_active', true).is('parent_id', null)
      if (data) setCategories(data)
    }
    init()
  }, [])

  const fetchProducts = async (reset = false) => {
    if (reset) { setPage(0); setProducts([]); setHasMore(true) }
    if (!hasMore && !reset) return
    
    setLoading(reset)
    setLoadingMore(!reset)

    const from = reset ? 0 : page * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    // ✅ اضافه شدن .gt('stock', 0) برای حذف محصولات ناموجود
    let query = supabase
      .from('products')
      .select('*, stores(name, discount_percentage, discount_expires_at, discount_category), reviews(rating, status)')
      .eq('status', 'active')
      .gt('stock', 0)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    if (selectedCategory) query = query.eq('category_id', selectedCategory)

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

  useEffect(() => { fetchProducts(true) }, [searchQuery, selectedCategory])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) fetchProducts()
      },
      { threshold: 1.0 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current) }
  }, [hasMore, loading, loadingMore, page])

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/products`)}`)
      return
    }

    const isFav = favoriteIds.includes(productId)

    if (isFav) {
      const { error } = await supabase.from('product_favorites').delete().eq('product_id', productId).eq('customer_id', user.id)
      if (!error) setFavoriteIds(prev => prev.filter(id => id !== productId))
    } else {
      const { error } = await supabase.from('product_favorites').insert([{ product_id: productId, customer_id: user.id }])
      if (!error) setFavoriteIds(prev => [...prev, productId])
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {searchQuery ? `نتایج جستجو برای: "${searchQuery}"` : 'همه محصولات'}
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-full sm:w-1/2 relative">
              <input 
                type="text" placeholder="جستجو در محصولات..." value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
              />
              {isTyping ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600"></div></div>
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
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 font-bold">هیچ محصولی با این مشخصات یافت نشد.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isFavorite={favoriteIds.includes(product.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
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