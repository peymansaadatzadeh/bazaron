'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '../../components/ProductCard'

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

// ✅ کامپوننت اصلی
function StoreContent() {
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
  const [toastMessage, setToastMessage] = useState('')
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [isDiscountActive, setIsDiscountActive] = useState(false)
  
  const [isClosed, setIsClosed] = useState(false)
  const [closureMessage, setClosureMessage] = useState('')
  const [closureTimeLeft, setClosureTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [hasClosureTimer, setHasClosureTimer] = useState(false)

  useEffect(() => {
    const fetchStoreData = async () => {
      const { data: storeData } = await supabase.from('stores').select('*').eq('id', storeId).single()
      if (storeData) {
        setStore(storeData)

        let closed = false;
        let msg = '';
        let hasTimer = false;

        if (storeData.is_suspended) {
          if (storeData.closed_until) {
            const diff = new Date(storeData.closed_until).getTime() - new Date().getTime();
            if (diff > 0) {
              closed = true;
              hasTimer = true;
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
              if (days > 0) msg = `فروشگاه به مدت ${days} روز توسط فروشنده تعطیل شده است.`;
              else if (hours > 0) msg = `فروشگاه به مدت ${hours} ساعت توسط فروشنده تعطیل شده است.`;
              else msg = `فروشگاه دقایقی دیگر بازگشایی می‌شود.`;
            }
          } else {
            closed = true;
            msg = 'فروشگاه تا اطلاع ثانوی توسط فروشنده تعطیل شده است.';
          }
        }
        setIsClosed(closed);
        setClosureMessage(msg);
        setHasClosureTimer(hasTimer);

        if (closed) {
          setLoading(false);
          return; 
        }
      }

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
    if (storeId) fetchStoreData()
  }, [storeId])

  useEffect(() => {
    if (!store?.discount_expires_at || store.discount_percentage === 0) return
    const timer = setInterval(() => {
      const diff = new Date(store.discount_expires_at).getTime() - new Date().getTime()
      if (diff <= 0) {
        clearInterval(timer)
        setIsDiscountActive(false)
      } else {
        setIsDiscountActive(true)
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [store])

  useEffect(() => {
    if (!isClosed || !hasClosureTimer || !store?.closed_until) return
    const timer = setInterval(() => {
      const diff = new Date(store.closed_until).getTime() - new Date().getTime()
      if (diff <= 0) {
        clearInterval(timer)
        window.location.reload(); 
      } else {
        setClosureTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [isClosed, hasClosureTimer, store])

  const handleFollowToggle = async () => {
    if (isClosed) return;
    if (!user) {
      showToast('برای دنبال کردن غرفه ابتدا باید وارد حساب خود شوید.')
      setTimeout(() => { router.push(`/login?redirect=${encodeURIComponent(`/store/${storeId}`)}`) }, 2000)
      return
    }

    if (isFollowing) {
      const { error } = await supabase.from('store_followers').delete().eq('store_id', storeId).eq('customer_id', user.id)
      if (!error) { setIsFollowing(false); setFollowersCount(prev => prev - 1); showToast('غرفه از لیست دنبال‌شده‌های شما حذف شد.') }
    } else {
      const { error } = await supabase.from('store_followers').insert([{ store_id: storeId, customer_id: user.id }])
      if (!error) { setIsFollowing(true); setFollowersCount(prev => prev + 1); showToast('غرفه با موفقیت دنبال شد.') }
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClosed) return;
    if (!user) {
      showToast('برای پسندیدن محصول ابتدا باید وارد حساب خود شوید.')
      setTimeout(() => { router.push(`/login?redirect=${encodeURIComponent(`/store/${storeId}`)}`) }, 2000)
      return
    }

    const isFav = favoriteProductIds.includes(productId)

    if (isFav) {
      const { error } = await supabase.from('product_favorites').delete().eq('product_id', productId).eq('customer_id', user.id)
      if (!error) { setFavoriteProductIds(prev => prev.filter(id => id !== productId)); showToast('محصول از علاقه‌مندی‌ها حذف شد.') }
    } else {
      const { error } = await supabase.from('product_favorites').insert([{ product_id: productId, customer_id: user.id }])
      if (!error) { setFavoriteProductIds(prev => [...prev, productId]); showToast('محصول به علاقه‌مندی‌ها اضافه شد.') }
    }
  }

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isClosed) return;
    if (!chatMessage.trim()) return

    if (!user) {
      showToast('برای ارسال پیام ابتدا باید وارد حساب خود شوید.')
      setShowChatModal(false)
      setTimeout(() => { router.push(`/login?redirect=${encodeURIComponent(`/store/${storeId}`)}`) }, 2000)
      return
    }

    setIsSendingMessage(true)
    const msgContent = chatMessage.trim()

    if (store && store.owner_id) {
      const { error } = await supabase.from('messages').insert([{
        sender_id: user.id, receiver_id: store.owner_id, store_id: storeId, content: msgContent
      }])
      if (!error) { showToast('پیام شما با موفقیت برای فروشنده ارسال شد.'); setShowChatModal(false); setChatMessage('') } 
      else { showToast('خطا در ارسال پیام.') }
    }
    setIsSendingMessage(false)
  }

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return p.title.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term));
  });

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000) }

  const handleAddToCartClick = (e: React.MouseEvent, product: any) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (isClosed) return;
    
    const existingCartString = localStorage.getItem('marketplace_cart')
    let cartData = existingCartString ? JSON.parse(existingCartString) : {}

    if (!cartData[product.store_id]) {
      cartData[product.store_id] = { storeName: store.name, items: [] }
    }

    const existingItemIndex = cartData[product.store_id].items.findIndex((item: any) => item.id === product.id)
    if (existingItemIndex > -1) { cartData[product.store_id].items[existingItemIndex].quantity += 1 } 
    else { cartData[product.store_id].items.push({ id: product.id, title: product.title, price: product.price, quantity: 1 }) }

    localStorage.setItem('marketplace_cart', JSON.stringify(cartData))
    showToast('محصول با موفقیت به سبد خرید اضافه شد!');
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>
  if (!store) return <div className="flex justify-center items-center min-h-screen text-xl text-red-600 font-bold">غرفه مورد نظر یافت نشد!</div>

  const avgStoreRating = productReviews.length > 0 ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1) : null

  const daysMap: any = { sat: 'شنبه', sun: 'یکشنبه', mon: 'دوشنبه', tue: 'سه‌شنبه', wed: 'چهارشنبه', thu: 'پنجشنبه', fri: 'جمعه' };
  const getWorkingDays = () => {
    if (!store.working_days) return 'نامشخص';
    return store.working_days.split(',').map((d: string) => daysMap[d] || d).join('، ');
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-20 relative">
      
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-fade-in-down">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          {toastMessage}
        </div>
      )}

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
                value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                rows={4} required placeholder="سلام، درباره محصولاتتون یه سوال داشتم..."
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />
              <button type="submit" disabled={isSendingMessage} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors">
                {isSendingMessage ? 'در حال ارسال...' : 'ارسال پیام'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className={`transition-all duration-700 ${isClosed ? 'grayscale opacity-60 pointer-events-none select-none' : ''}`}>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          {isDiscountActive && !isClosed && (
            <div className="bg-gradient-to-l from-red-600 to-rose-500 rounded-3xl p-6 sm:p-8 mb-8 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 text-3xl shadow-inner">🔥</div>
                <div>
                  <h2 className="text-2xl font-black mb-1">
                    {store.discount_percentage}٪ تخفیف ویژه {store.discount_category !== 'all' ? `روی ${store.discount_category}` : 'تمام محصولات'}
                  </h2>
                  <p className="text-sm opacity-90">فرصت محدود! همین حالا خرید خود را نهایی کنید.</p>
                </div>
              </div>
              <div className="relative z-10 bg-black/30 py-3 px-6 rounded-2xl border border-white/10 backdrop-blur-md text-center min-w-[200px]" dir="ltr">
                <p className="text-xs text-red-100 mb-1 font-bold">زمان باقی‌مانده</p>
                <div className="flex items-center justify-center gap-2 font-mono font-black text-2xl">
                  <div className="flex flex-col items-center"><span>{String(timeLeft.h).padStart(2, '0')}</span><span className="text-[10px] text-red-200">ساعت</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span>{String(timeLeft.m).padStart(2, '0')}</span><span className="text-[10px] text-red-200">دقیقه</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span>{String(timeLeft.s).padStart(2, '0')}</span><span className="text-[10px] text-red-200">ثانیه</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="w-full h-48 md:h-64 bg-gray-100 relative">
              {store.cover_url ? (
                <img src={store.cover_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50"></div>
              )}
            </div>
            
            <div className="relative px-8 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full shadow-lg flex items-center justify-center text-5xl md:text-6xl font-black text-indigo-600 border-4 border-white z-10 overflow-hidden shrink-0">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  store.name.charAt(0)
                )}
              </div>
              
              <div className="text-center md:text-right flex-grow pb-2 mt-4 md:mt-0">
                <h2 className="text-3xl font-black text-gray-800 mb-2">{store.name}</h2>
                <p className="text-gray-600 max-w-2xl mb-3">{store.description || 'توضیحاتی ثبت نشده است.'}</p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{followersCount} دنبال‌کننده</span>
                  
                  <button onClick={handleFollowToggle} disabled={isClosed} className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${isFollowing ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}>
                    {isFollowing ? 'لغو دنبال کردن' : 'دنبال کردن غرفه'}
                  </button>

                  <button onClick={() => setShowChatModal(true)} disabled={isClosed} className="px-5 py-2 rounded-full text-sm font-bold transition-all bg-gray-800 text-white hover:bg-gray-900 shadow-md flex items-center gap-2 disabled:opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    چت با فروشنده
                  </button>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 pb-2">
                <a href="#store-reviews" className="inline-flex flex-col items-center justify-center bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-100 p-4 rounded-2xl transition-all duration-300 group pointer-events-auto">
                  <StarRating rating={avgStoreRating ? parseFloat(avgStoreRating) : null} />
                  <span className="text-sm text-gray-500 font-bold mt-2 group-hover:text-indigo-600 transition-colors">نظرها برای محصولات</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
              <div><p className="text-xs text-gray-400 font-bold mb-1">روزهای فعالیت</p><p className="text-sm font-black text-gray-800">{getWorkingDays()}</p></div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <div><p className="text-xs text-gray-400 font-bold mb-1">ساعات کاری</p><p className="text-sm font-black text-gray-800 font-mono" dir="ltr">{store.working_hours || 'نامشخص'}</p></div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
              <div className="overflow-hidden"><p className="text-xs text-gray-400 font-bold mb-1">آدرس و تماس</p><p className="text-sm font-black text-gray-800 truncate" title={store.address}>{store.address || 'نامشخص'}</p><p className="text-xs text-gray-500 font-mono mt-1" dir="ltr">{store.phone_number}</p></div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 whitespace-nowrap">محصولات این غرفه</h3>
            <div className="relative w-full md:w-1/2">
              <input type="text" placeholder="جستجو در محصولات..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10" />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 mb-12">این غرفه هنوز محصولی ثبت نکرده است.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
              {filteredProducts.map((product) => {
                const pReviews = productReviews.filter(r => r.product_id === product.id);
                const avgProductRating = pReviews.length > 0 ? (pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length).toFixed(1) : null;
                const isFav = favoriteProductIds.includes(product.id);
                
                const productWithRating = { ...product, avgRating: avgProductRating, reviewCount: pReviews.length };

                return (
                  <ProductCard 
                    key={product.id} 
                    product={productWithRating} 
                    storeData={store} 
                    isFavorite={isFav}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )
              })}
            </div>
          )}
        </main>
      </div>

      {isClosed && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-auto bg-black/20">
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center transform scale-100 animate-fade-in-up">
            <div className="w-20 h-20 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">فروشگاه تعطیل است</h2>
            <p className="text-gray-700 font-bold leading-relaxed text-sm mb-4">{closureMessage}</p>
            
            {hasClosureTimer && (
              <div className="bg-gray-100 rounded-2xl p-4 mb-6 border border-gray-200" dir="ltr">
                <p className="text-xs text-gray-500 mb-2 font-bold">زمان باقی‌مانده تا بازگشایی</p>
                <div className="flex items-center justify-center gap-2 font-mono font-black text-2xl text-gray-700">
                  <div className="flex flex-col items-center"><span>{String(closureTimeLeft.d).padStart(2, '0')}</span><span className="text-[10px] text-gray-400">روز</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span>{String(closureTimeLeft.h).padStart(2, '0')}</span><span className="text-[10px] text-gray-400">ساعت</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span>{String(closureTimeLeft.m).padStart(2, '0')}</span><span className="text-[10px] text-gray-400">دقیقه</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span>{String(closureTimeLeft.s).padStart(2, '0')}</span><span className="text-[10px] text-gray-400">ثانیه</span></div>
                </div>
              </div>
            )}

            <Link href="/" className="inline-block bg-gray-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-md">
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  )
}

// ✅ خروجی نهایی با Suspense
export default function StorePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <StoreContent />
    </Suspense>
  )
}
