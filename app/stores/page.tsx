'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

function StoresContent() {
  const [stores, setStores] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const router = useRouter()

  // استیت‌های جستجوی لایو
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isTyping, setIsTyping] = useState(false)

  // Debounce برای غرفه‌ها
  useEffect(() => {
    if (inputValue === searchQuery) return;

    setIsTyping(true)
    const timer = setTimeout(() => {
      if (inputValue.trim()) {
        router.push(`/stores?search=${encodeURIComponent(inputValue)}`)
      } else {
        router.push(`/stores`)
      }
      setIsTyping(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [inputValue, router, searchQuery])

  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').eq('type', 'store').eq('is_active', true).is('parent_id', null)
      if (data) setCategories(data)
    }
    fetchCategories()
  }, [])

  const fetchStores = async () => {
    setLoading(true)
    
    let query = supabase
      .from('stores')
      .select(`
        *,
        products (
          reviews (rating, status)
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    const term = searchQuery.trim()
    if (term) {
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    }
    
    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory)
    }

    const { data, error } = await query
    
    if (!error && data) {
      setStores(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStores()
  }, [searchQuery, selectedCategory])

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {searchQuery ? `نتایج جستجو برای: "${searchQuery}"` : 'همه غرفه‌ها'}
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            
            {/* جستجوی لایو */}
            <div className="w-full sm:w-1/2 relative">
              <input 
                type="text" 
                placeholder="جستجوی غرفه..." 
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
        ) : stores.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 font-bold">
            هیچ غرفه‌ای با این مشخصات یافت نشد.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {stores.map((store) => {
              let allRatings: number[] = []
              if (store.products) {
                store.products.forEach((p: any) => {
                  if (p.reviews) {
                    p.reviews.forEach((r: any) => {
                      if (r.status === 'approved') allRatings.push(r.rating)
                    })
                  }
                })
              }
              const avgRating = allRatings.length > 0 
                ? (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1) 
                : null

              return (
                <Link key={store.id} href={`/store/${store.id}`} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col transform hover:-translate-y-1 p-6 items-center text-center">
                  
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full flex items-center justify-center text-3xl font-black text-indigo-600 mb-4 border-4 border-white shadow-md group-hover:scale-110 transition-transform overflow-hidden">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      store.name.charAt(0)
                    )}
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{store.name}</h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{store.description || 'توضیحاتی ثبت نشده است.'}</p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 w-full flex justify-between items-center">
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">مشاهده غرفه</span>
                    {avgRating && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="font-bold text-gray-700 text-sm">{avgRating}</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StoresPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <StoresContent />
    </Suspense>
  )
}