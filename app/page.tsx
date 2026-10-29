'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const ProductCard = ({ product }: { product: any }) => (
  <Link href={`/product/${product.id}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col w-[220px] sm:w-[240px] shrink-0">
    <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
      {product.image_url ? (
        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
    </div>
    <div className="p-4 flex flex-col flex-grow">
      <h4 className="font-bold text-gray-800 mb-1 truncate text-sm">{product.title}</h4>
      <p className="text-xs text-gray-500 mb-2 truncate">{product.stores?.name}</p>
      <div className="mt-auto">
        <span className="font-black text-indigo-600 text-sm">{product.price.toLocaleString()} <span className="text-xs font-normal text-gray-500">تومان</span></span>
      </div>
    </div>
  </Link>
)

const StoreCard = ({ store, avgRating }: { store: any, avgRating: string | null }) => (
  <Link href={`/store/${store.id}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center text-center border border-gray-100 w-[200px] sm:w-[220px] shrink-0">
    <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full flex items-center justify-center text-3xl font-black text-indigo-600 mb-4 border-2 border-white shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
      {store.logo_url ? (
        <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
      ) : (
        store.name.charAt(0)
      )}
    </div>
    <h4 className="font-bold text-gray-800 mb-1 truncate w-full">{store.name}</h4>
    {avgRating && (
      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md mt-2">
        <span className="text-yellow-500 text-sm">★</span>
        <span className="font-bold text-gray-700 text-xs">{avgRating}</span>
      </div>
    )}
  </Link>
)

export default function HomePage() {
  const [latestProducts, setLatestProducts] = useState<any[]>([])
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const [topStores, setTopStores] = useState<any[]>([])
  const [newestStores, setNewestStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: latest } = await supabase.from('products').select('*, stores(name)').eq('status', 'active').order('created_at', { ascending: false }).limit(10)
      if (latest) setLatestProducts(latest)

      const { data: best } = await supabase.from('products').select('*, stores(name)').eq('status', 'active').order('stock', { ascending: true }).limit(10)
      if (best) setBestSellers(best)

      const { data: storesData } = await supabase.from('stores').select(`*, products ( reviews ( rating, status ) )`).eq('status', 'active').order('created_at', { ascending: false })

      if (storesData) {
        setNewestStores(storesData.slice(0, 10))
        const storesWithRating = storesData.map((store: any) => {
          let allRatings: number[] = []
          if (store.products && store.products.length > 0) {
            store.products.forEach((product: any) => {
              if (product.reviews && product.reviews.length > 0) {
                product.reviews.forEach((review: any) => {
                  if (review.status === 'approved') allRatings.push(review.rating)
                })
              }
            })
          }
          const avg = allRatings.length > 0 ? (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1) : null
          return { ...store, avgRating: avg, totalRatings: allRatings.length }
        })

        const sortedTopStores = storesWithRating.filter((s: any) => s.avgRating !== null).sort((a: any, b: any) => {
            if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating
            return b.totalRatings - a.totalRatings
        }).slice(0, 10)

        if (sortedTopStores.length < 10) {
          const remaining = storesWithRating.filter((s: any) => !sortedTopStores.find((ts: any) => ts.id === s.id))
          sortedTopStores.push(...remaining.slice(0, 10 - sortedTopStores.length))
        }
        setTopStores(sortedTopStores)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-hidden">
      <div className="relative bg-indigo-900 overflow-hidden mb-12">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="Background" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-sm">به بازار <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">متل قو</span> خوش آمدید</h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mb-8 font-medium">جدیدترین محصولات، برترین غرفه‌ها و بهترین تجربه خرید آنلاین در شهر شما.</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <section>
          <div className="flex justify-between items-end mb-6">
            <div><h2 className="text-2xl font-black text-gray-800">جدیدترین محصولات</h2><p className="text-gray-500 text-sm mt-1">تازه‌ترین‌ها از غرفه‌های مختلف</p></div>
            <Link href="/products" className="text-indigo-600 text-sm font-bold hover:text-indigo-800 transition-colors flex items-center gap-1">مشاهده همه <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">{latestProducts.map(product => <ProductCard key={product.id} product={product} />)}</div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-6">
            <div><h2 className="text-2xl font-black text-gray-800">پرفروش‌ترین‌ها</h2><p className="text-gray-500 text-sm mt-1">محصولاتی که بیشترین استقبال را داشته‌اند</p></div>
            <Link href="/products?sort=best" className="text-indigo-600 text-sm font-bold hover:text-indigo-800 transition-colors flex items-center gap-1">مشاهده همه <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">{bestSellers.map(product => <ProductCard key={product.id} product={product} />)}</div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-6">
            <div><h2 className="text-2xl font-black text-gray-800">غرفه‌های برتر</h2><p className="text-gray-500 text-sm mt-1">با بالاترین امتیاز از طرف خریداران</p></div>
            <Link href="/stores?sort=top" className="text-indigo-600 text-sm font-bold hover:text-indigo-800 transition-colors flex items-center gap-1">مشاهده همه <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">{topStores.map(store => <StoreCard key={store.id} store={store} avgRating={store.avgRating} />)}</div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-6">
            <div><h2 className="text-2xl font-black text-gray-800">جدیدترین غرفه‌ها</h2><p className="text-gray-500 text-sm mt-1">به تازگی به بازار ما پیوسته‌اند</p></div>
            <Link href="/stores" className="text-indigo-600 text-sm font-bold hover:text-indigo-800 transition-colors flex items-center gap-1">مشاهده همه <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide">{newestStores.map(store => <StoreCard key={store.id} store={store} avgRating={null} />)}</div>
        </section>
      </main>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  )
}