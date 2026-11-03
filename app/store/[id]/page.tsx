'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const StarRating = ({ rating, size = "w-5 h-5" }: { rating: number | null, size?: string }) => {
  const r = rating ? parseFloat(rating.toString()) : 0;
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        if (r >= star) {
          return <svg key={star} className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
        } else if (r >= star - 0.5) {
          return <div key={star} className={`relative ${size}`}><svg className={`absolute top-0 left-0 ${size} text-gray-300`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><div className="absolute top-0 left-0 overflow-hidden w-1/2"><svg className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></div></div>;
        } else {
          return <svg key={star} className={`${size} text-gray-300`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
        }
      })}
    </div>
  );
};

export default function StorePage() {
  const params = useParams()
  const storeId = params.id as string
  const router = useRouter()

  const [store, setStore] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [productReviews, setProductReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [user, setUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([])

  const [searchTerm, setSearchTerm] = useState('')

  const [showShippingWarning, setShowShippingWarning] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<any>(null)
  const [toastMessage, setToastMessage] = useState('')

  // استیت‌های چت
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const fetchStoreData = async () => {
    const { data: storeData } = await supabase.from('stores').select('*').eq('id', storeId).single()
    if (storeData) setStore(storeData)

    const { data: productsData } = await supabase.from('products').select('*').eq('store_id', storeId).eq('status', 'active')
    if (productsData) setProducts(productsData)

    if (productsData && productsData.length > 0) {
      const productIds = productsData.map(p => p.id)
      const { data: pReviews } = await supabase.from('reviews').select('*, products(title)').in('product_id', productIds).eq('status', 'approved').order('created_at', { ascending: false })
      if (pReviews) setProductReviews(pReviews)
    }

    const { count } = await supabase.from('store_followers').select('*', { count: 'exact', head: true }).eq('store_id', storeId)
    setFollowersCount(count || 0)

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      
      const { data: followData } = await supabase.from('store_followers').select('id').eq('store_id', storeId).eq('customer_id', session.user.id).maybeSingle()
      if (followData) setIsFollowing(true)

      const { data: favs } = await supabase.from('product_favorites').select('product_id').eq('customer_id', session.user.id)
      if (favs) setFavoriteProductIds(favs.map(f => f.product_id))
    }
    setLoading(false)
  }

  useEffect(() => {
    if (storeId) fetchStoreData()
  }, [storeId])

  const handleFollowToggle = async () => {
    if (!user) {
      showToast('برای دنبال کردن غرفه ابتدا باید وارد حساب خود شوید.')
      setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(`/store/${storeId}`)}`)
      }, 2000)
      return
    }

    if (isFollowing) {
      const { error } = await supabase.from('store_followers').delete().eq('store_id', storeId).eq('customer_id', user.id)
      if (!error) {
        setIsFollowing(false)
        setFollowersCount(prev => prev - 1)
        showToast('غرفه از لیست دنبال‌شده‌های شما حذف شد.')
      }
    } else {
      const { error } = await supabase.from('store_followers').insert([{ store_id: storeId, customer_id: user.id }])
      if (!error) {
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
        showToast('غرفه با موفقیت دنبال شد.')
      }
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!user) {
      showToast('برای پسندیدن محصول ابتدا باید وارد حساب خود شوید.')
      setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(`/store/${storeId}`)}`)
      }, 2000)
      return
    }

    const isFav = favoriteProductIds.includes(productId)

    if (isFav) {
      const { error } = await supabase.from('product_favorites').delete().eq('product_id', productId).eq('customer_id', user.id)
      if (!error) {
        setFavoriteProductIds(prev => prev.filter(id => id !== productId))
        showToast('محصول از علاقه‌مندی‌ها حذف شد.')
      }
    } else {
      const { error } = await supabase.from('product_favorites').insert([{ product_id: productId, customer_id: user.id }])
      if (!error) {
        setFavoriteProductIds(prev => [...prev, productId])
        showToast('محصول به علاقه‌مندی‌ها اضافه شد.')
      }
    }
  }

  // تابع اصلاح شده برای ارسال پیام
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    if (!user) {
      showToast('برای ارسال پیام ابتدا باید وارد حساب خود شوید.')
      setShowChatModal(false)
      setTimeout(() => {
        router.push(`/login?redirect=${encodeURIComponent(`/store/${storeId}`)}`)
      }, 2000)
      return
    }

    setIsSendingMessage(true)
    const msgContent = chatMessage.trim()

    // استفاده از owner_id موجود در استیت store که قبلاً گرفتیم
    if (store && store.owner_id) {
      const { error } = await supabase.from('messages').insert([{
        sender_id: user.id,
        receiver_id: store.owner_id,
        store_id: storeId,
        content: msgContent
      }])

      if (!error) {
        showToast('پیام شما با موفقیت برای فروشنده ارسال شد.')
        setShowChatModal(false)
        setChatMessage('')
      } else {
        showToast('خطا در ارسال پیام.')
      }
    }
    setIsSendingMessage(false)
  }

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return p.title.toLowerCase().includes(term) || 
           (p.description && p.description.toLowerCase().includes(term)) ||
           (p.category && p.category.toLowerCase().includes(term));
  });

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleAddToCartClick = (e: React.MouseEvent, product: any) => {
    e.stopPropagation(); 
    const existingCartString = localStorage.getItem('marketplace_cart')
    let cartData = existingCartString ? JSON.parse(existingCartString) : {}
    const cartStoreIds = Object.keys(cartData)

    if (cartStoreIds.length === 0 || cartData[storeId]) {
      addToCartLogic(product, cartData);
    } else {
      setPendingProduct(product);
      setShowShippingWarning(true);
    }
  }

  const addToCartLogic = (product: any, existingCartData?: any) => {
    const existingCartString = localStorage.getItem('marketplace_cart')
    let cartData = existingCartData || (existingCartString ? JSON.parse(existingCartString) : {})

    if (!cartData[storeId]) {
      cartData[storeId] = { storeName: store.name, items: [] }
    }

    const existingItemIndex = cartData[storeId].items.findIndex((item: any) => item.id === product.id)
    if (existingItemIndex > -1) {
      cartData[storeId].items[existingItemIndex].quantity += 1
    } else {
      cartData[storeId].items.push({ id: product.id, title: product.title, price: product.price, quantity: 1 })
    }

    localStorage.setItem('marketplace_cart', JSON.stringify(cartData))
    showToast('محصول با موفقیت به سبد خرید اضافه شد!');
  }

  const handleConfirmAddWithFee = () => {
    if (pendingProduct) {
      addToCartLogic(pendingProduct);
      setShowShippingWarning(false);
      setPendingProduct(null);
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>
  if (!store) return <div className="flex justify-center items-center min-h-screen text-xl text-red-600 font-bold">غرفه مورد نظر یافت نشد!</div>

  const avgStoreRating = productReviews.length > 0 ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1) : null

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-20 relative">
      
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-fade-in-down">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          {toastMessage}
        </div>
      )}

      {/* پاپ‌آپ هشدار هزینه پیک */}
      {showShippingWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-fade-in-down">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            <h3 className="text-xl font-black text-gray-800 text-center mb-2">توجه! خرید از چند غرفه</h3>
            <p className="text-gray-600 text-center text-sm mb-6 leading-relaxed">با خرید همزمان از چند غرفه، مبلغ <span className="font-bold text-orange-600">۳۰,۰۰۰ تومان</span> هزینه جمع‌آوری خرید شما از غرفه‌های سطح شهر برای پیک به فاکتورتان اضافه می‌شود. برای ارسال رایگان، محصولات را از یک غرفه انتخاب کنید.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleConfirmAddWithFee} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">تایید و افزودن به سبد خرید</button>
              <button onClick={() => { setShowShippingWarning(false); setPendingProduct(null); }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">انصراف (فقط از همین غرفه خرید می‌کنم)</button>
            </div>
          </div>
        </div>
      )}

      {/* پاپ‌آپ چت */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-bold text-gray-800">ارسال پیام به {store.name}</h3>
              <button onClick={() => setShowChatModal(false)} className="text-gray-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSendChatMessage}>
              <textarea 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                rows={4}
                required
                placeholder="سلام، درباره محصولاتتون یه سوال داشتم..."
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />
              <button type="submit" disabled={isSendingMessage} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">
                {isSendingMessage ? 'در حال ارسال...' : 'ارسال پیام'}
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-50 to-indigo-50"></div>
          <div className="relative p-8 flex flex-col md:flex-row items-center md:items-end gap-6 pt-12">
            <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center text-5xl font-black text-indigo-600 border-4 border-white z-10 -mb-4 md:mb-0 overflow-hidden">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                store.name.charAt(0)
              )}
            </div>
            <div className="text-center md:text-right flex-grow pb-2">
              <h2 className="text-3xl font-black text-gray-800 mb-2">{store.name}</h2>
              <p className="text-gray-600 max-w-2xl mb-3">{store.description || 'توضیحاتی ثبت نشده است.'}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{followersCount} دنبال‌کننده</span>
                
                <button 
                  onClick={handleFollowToggle}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                    isFollowing 
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                  }`}
                >
                  {isFollowing ? 'لغو دنبال کردن' : 'دنبال کردن غرفه'}
                </button>

                <button 
                  onClick={() => setShowChatModal(true)}
                  className="px-5 py-2 rounded-full text-sm font-bold transition-all bg-gray-800 text-white hover:bg-gray-900 shadow-md flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  چت با فروشنده
                </button>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 pb-2">
              <a href="#store-reviews" className="inline-flex flex-col items-center justify-center bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-100 p-4 rounded-2xl transition-all duration-300 group">
                <StarRating rating={avgStoreRating ? parseFloat(avgStoreRating) : null} />
                <span className="text-sm text-gray-500 font-bold mt-2 group-hover:text-indigo-600 transition-colors">نظرها برای محصولات</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 whitespace-nowrap">محصولات این غرفه</h3>
          
          <div className="relative w-full md:w-1/2">
            <input 
              type="text" 
              placeholder="جستجو در محصولات این غرفه..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
            />
            {searchTerm ? (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 mb-12">این غرفه هنوز محصولی ثبت نکرده است.</div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 mb-12">
            هیچ محصولی با عبارت "{searchTerm}" در این غرفه یافت نشد.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {filteredProducts.map((product) => {
              const pReviews = productReviews.filter(r => r.product_id === product.id);
              const avgProductRating = pReviews.length > 0 ? (pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length) : null;
              const isFav = favoriteProductIds.includes(product.id);
              
              return (
                <div 
                  key={product.id} 
                  onClick={() => router.push(`/product/${product.id}`)}
                  className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col transform hover:-translate-y-1 cursor-pointer"
                >
                  <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h4 className="font-bold text-gray-800 mb-1 truncate text-lg">{product.title}</h4>
                    <p className="text-gray-500 text-sm mb-2 line-clamp-2 leading-relaxed">{product.description}</p>
                    
                    <div className="flex items-center gap-1 mb-3">
                      {avgProductRating ? (
                        <>
                          <StarRating rating={avgProductRating} size="w-3.5 h-3.5" />
                          <span className="text-xs text-gray-500">({pReviews.length})</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400">بدون امتیاز</span>
                      )}
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-black text-blue-600 text-lg">{product.price.toLocaleString()} <span className="text-xs font-normal text-gray-500">تومان</span></span>
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md">موجودی: {product.stock}</span>
                      </div>
                      
                      <div className="flex gap-2 relative z-10">
                        <button 
                          onClick={(e) => handleToggleFavorite(e, product.id)} 
                          className={`w-1/3 py-2.5 rounded-xl border flex justify-center items-center transition-colors ${isFav ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFav ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </button>
                        
                        <button 
                          onClick={(e) => handleAddToCartClick(e, product)} 
                          disabled={product.stock === 0} 
                          className="w-2/3 bg-indigo-50 text-indigo-700 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 transition-colors text-sm font-bold"
                        >
                          {product.stock === 0 ? 'ناموجود' : 'افزودن به سبد'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div id="store-reviews" className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 border-r-4 border-indigo-500 pr-3">نظرات کاربران در مورد محصولات</h2>
          {productReviews.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl"><p className="text-gray-500">هنوز هیچ نظری برای محصولات این غرفه ثبت نشده است.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productReviews.map((review) => (
                <div key={review.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">{review.reviewer_name ? review.reviewer_name.charAt(0) : 'ک'}</div>
                      <div>
                        <span className="font-bold text-gray-800 block">{review.reviewer_name || 'کاربر'}</span>
                        <span className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-0.5 rounded-full mt-1 inline-block">{review.products?.title}</span>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="w-3.5 h-3.5" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style jsx global>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  )
}