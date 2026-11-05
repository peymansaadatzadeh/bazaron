'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '../../components/ProductCard'

const StarRating = ({ rating, size = "w-5 h-5" }: { rating: number | null, size?: string }) => {
  const r = rating ? parseFloat(rating.toString()) : 0;
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${size} ${r >= star - 0.5 ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
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
    if (isClosed) return;
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

  const calculateFinalPrice = (product: any) => {
    if (!isDiscountActive) return product.price
    if (store.discount_category && store.discount_category !== 'all') {
      if (product.category !== store.discount_category) return product.price
    }
    return product.price - (product.price * (store.discount_percentage / 100))
  }

  const addToCartLogic = (product: any, existingCartData?: any) => {
    const existingCartString = localStorage.getItem('marketplace_cart')
    let cartData = existingCartData || (existingCartString ? JSON.parse(existingCartString) : {})
    const finalPrice = calculateFinalPrice(product)

    if (!cartData[storeId]) {
      cartData[storeId] = { storeName: store.name, items: [] }
    }

    const existingItemIndex = cartData[storeId].items.findIndex((item: any) => item.id === product.id)
    if (existingItemIndex > -1) { cartData[storeId].items[existingItemIndex].quantity += 1 }
    else { cartData[storeId].items.push({ id: product.id, title: product.title, price: finalPrice, quantity: 1 }) }

    localStorage.setItem('marketplace_cart', JSON.stringify(cartData))
    showToast('محصول با موفقیت به سبد خرید اضافه شد!');
  }

  const handleConfirmAddWithFee = () => {
    if (pendingProduct) { addToCartLogic(pendingProduct); setShowShippingWarning(false); setPendingProduct(null); }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-slate-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-700"></div></div>
  if (!store) return <div className="flex justify-center items-center min-h-screen text-xl text-red-600 font-bold">غرفه مورد نظر یافت نشد!</div>

  const avgStoreRating = productReviews.length > 0 ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1) : null

  const daysMap: any = { sat: 'شنبه', sun: 'یکشنبه', mon: 'دوشنبه', tue: 'سه‌شنبه', wed: 'چهارشنبه', thu: 'پنجشنبه', fri: 'جمعه' };
  const getWorkingDays = () => {
    if (!store.working_days) return 'نامشخص';
    return store.working_days.split(',').map((d: string) => daysMap[d] || d).join('، ');
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f3f6fc] pb-16 relative overflow-hidden">

      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-[#07375b] text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-fade-in-down border border-amber-300/40">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {toastMessage}
        </div>
      )}

      {showShippingWarning && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-100 animate-fade-in-down">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2">توجه! خرید از چند غرفه</h3>
            <p className="text-slate-600 text-center text-sm mb-6 leading-7">
              با خرید همزمان از چند غرفه، مبلغ <span className="font-black text-amber-600">۳۰,۰۰۰ تومان</span> هزینه جمع‌آوری خرید شما از غرفه‌های سطح شهر برای پیک به فاکتورتان اضافه می‌شود. برای ارسال رایگان، محصولات را از یک غرفه انتخاب کنید.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleConfirmAddWithFee} className="w-full bg-gradient-to-l from-[#0b527c] to-[#062b4a] text-white py-3.5 rounded-2xl font-black hover:brightness-110 transition-all">
                تایید و افزودن به سبد خرید
              </button>
              <button onClick={() => { setShowShippingWarning(false); setPendingProduct(null); }} className="w-full bg-slate-100 text-slate-700 py-3.5 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                انصراف (فقط از همین غرفه خرید می‌کنم)
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-fade-in-up">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-800">ارسال پیام به {store.name}</h3>
              <button onClick={() => setShowChatModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSendChatMessage}>
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                rows={4}
                required
                placeholder="سلام، درباره محصولاتتون یه سوال داشتم..."
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 mb-4"
              />
              <button type="submit" disabled={isSendingMessage} className="w-full bg-gradient-to-l from-[#0b527c] to-[#062b4a] text-white py-3.5 rounded-2xl font-black hover:brightness-110 disabled:bg-gray-400 transition-all">
                {isSendingMessage ? 'در حال ارسال...' : 'ارسال پیام'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className={`transition-all duration-700 ${isClosed ? 'grayscale opacity-60 pointer-events-none select-none' : ''}`}>

        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-10">

          {/* کاور و سربرگ غرفه */}
          <section className="relative mb-8">
            <div className="relative h-[250px] sm:h-[310px] md:h-[370px] overflow-hidden rounded-b-[3rem] sm:rounded-b-[4rem] bg-[#062b4a] shadow-xl">
              {store.cover_url ? (
                <img src={store.cover_url} alt={store.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d527c] via-[#082f50] to-[#031b31]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-l from-[#031b31]/95 via-[#062b4a]/65 to-transparent" />

              <div className="absolute top-5 right-5 left-5 flex items-center justify-between z-10">
                <Link href="/" className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-950/30 border border-white/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-950/30 border border-white/40 text-white flex items-center justify-center backdrop-blur-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 12.5l2.5 2.5 5-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 max-w-[65%] text-white z-10">
                <div className="text-amber-300 text-3xl sm:text-5xl mb-3">✦</div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight drop-shadow-lg">{store.name}</h1>
                <p className="text-sm sm:text-lg md:text-xl text-white/90 mt-3 leading-8 max-w-xl">
                  {store.description || 'به غرفه ما خوش آمدید'}
                </p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100" />
            </div>

            {/* اطلاعات اصلی غرفه */}
            <div className="relative -mt-12 sm:-mt-16 mx-2 sm:mx-5 bg-gradient-to-br from-white via-[#f8faff] to-[#edf3fc] rounded-t-[2.5rem] rounded-b-[2rem] shadow-[0_15px_40px_rgba(15,45,75,0.12)] border border-white px-4 sm:px-8 pt-4 pb-7">
              <div className="flex flex-col items-center text-center">
                <div className="relative -mt-16 sm:-mt-20 mb-3">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1.5 bg-gradient-to-br from-amber-200 via-amber-500 to-amber-100 shadow-xl">
                    <div className="w-full h-full rounded-full bg-[#062b4a] border-4 border-white overflow-hidden flex items-center justify-center text-white text-4xl font-black">
                      {store.logo_url ? (
                        <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        store.name.charAt(0)
                      )}
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-0 w-9 h-9 rounded-full bg-blue-600 border-4 border-white text-white flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
                  {store.name}
                  <span className="text-blue-600 text-xl">✓</span>
                </h2>
                <p className="text-slate-500 text-sm sm:text-lg mt-1">فروشنده بازار متل قو</p>

                <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6">
                  <div className="order-3 sm:order-1 w-full sm:w-auto min-w-[170px] bg-white rounded-full border border-slate-100 shadow-md px-5 py-3 flex items-center justify-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m16-13a4 4 0 110 8m4 5v-2a4 4 0 00-3-3.87M9 11a4 4 0 100-8 4 4 0 000 8z" />
                    </svg>
                    <div className="text-right">
                      <strong className="block text-xl font-black text-[#092f50]">{followersCount.toLocaleString('fa-IR')}</strong>
                      <span className="text-sm text-slate-500 font-bold">دنبال‌کننده</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowChatModal(true)}
                    disabled={isClosed}
                    className="order-2 w-full sm:w-auto flex-1 max-w-xs border-2 border-blue-800 text-blue-900 bg-white rounded-full py-3.5 px-5 font-black flex items-center justify-center gap-2 hover:bg-blue-50 transition-all disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M21 11.5c0 4.142-4.03 7.5-9 7.5a10.2 10.2 0 01-4.255-.9L3 20l1.395-3.5C3.512 15.042 3 13.574 3 12c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7z" />
                    </svg>
                    چت با فروشنده
                  </button>

                  <button
                    onClick={handleFollowToggle}
                    disabled={isClosed}
                    className={`order-1 sm:order-3 w-full sm:w-auto flex-1 max-w-xs rounded-full py-3.5 px-5 font-black flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 ${isFollowing ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-gradient-to-br from-[#ffe8a0] via-[#e8b95b] to-[#b87922] text-[#102e48] hover:brightness-105'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m16-13a4 4 0 110 8m-4 5v-2a4 4 0 00-3-3.87M9 11a4 4 0 100-8 4 4 0 000 8z" />
                    </svg>
                    {isFollowing ? 'لغو دنبال کردن' : 'دنبال کردن'}
                  </button>
                </div>

                <a href="#store-reviews" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-700 transition-colors">
                  <StarRating rating={avgStoreRating ? parseFloat(avgStoreRating) : null} size="w-4 h-4" />
                  {avgStoreRating ? `امتیاز غرفه ${avgStoreRating} از ۵` : 'هنوز امتیازی ثبت نشده است'}
                </a>
              </div>
            </div>
          </section>

          {/* بنر تخفیف */}
          {isDiscountActive && !isClosed && (
            <div className="relative overflow-hidden bg-gradient-to-l from-[#9f1239] via-[#e11d48] to-[#fb7185] rounded-[2rem] p-5 sm:p-7 mb-7 shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="absolute -left-8 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 text-3xl">🔥</div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black mb-1">
                    {store.discount_percentage}٪ تخفیف ویژه {store.discount_category !== 'all' ? `روی ${store.discount_category}` : 'تمام محصولات'}
                  </h2>
                  <p className="text-sm text-white/90">فرصت محدود! همین حالا خرید خود را نهایی کنید.</p>
                </div>
              </div>
              <div className="relative z-10 bg-black/20 py-3 px-6 rounded-2xl border border-white/20 text-center min-w-[190px]" dir="ltr">
                <p className="text-xs text-white/80 mb-1 font-bold">زمان باقی‌مانده</p>
                <div className="flex items-center justify-center gap-2 font-mono font-black text-2xl">
                  <span>{String(timeLeft.h).padStart(2, '0')}</span>
                  <span>:</span>
                  <span>{String(timeLeft.m).padStart(2, '0')}</span>
                  <span>:</span>
                  <span>{String(timeLeft.s).padStart(2, '0')}</span>
                </div>
                <div className="text-[10px] mt-1 text-white/80">ساعت : دقیقه : ثانیه</div>
              </div>
            </div>
          )}

          {/* نوار اطلاعات فعالیت غرفه */}
          <section className="mb-7 rounded-[2rem] overflow-hidden border-b-4 border-amber-400 bg-gradient-to-l from-[#062b4a] via-[#0b527c] to-[#062b4a] shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-white/30 text-white">
              <div className="p-5 flex items-center justify-center gap-4">
                <div className="text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 9l1.5-5h15L21 9M5 9v11h14V9M3 9h18M9 20v-6h6v6M8 9a2 2 0 104 0m0 0a2 2 0 104 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white/80 mb-1">وضعیت غرفه</p>
                  <p className="font-black text-emerald-300 text-xl flex items-center gap-2">
                    باز است <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  </p>
                </div>
              </div>

              <div className="p-5 flex items-center justify-center gap-4">
                <div className="text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white/80 mb-1">ساعت کاری</p>
                  <p className="font-black text-lg" dir="ltr">{store.working_hours || 'نامشخص'}</p>
                </div>
              </div>

              <div className="p-5 flex items-center justify-center gap-4">
                <div className="text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white/80 mb-1">روزهای فعالیت</p>
                  <p className="font-black text-base sm:text-lg">{getWorkingDays()}</p>
                </div>
              </div>
            </div>
          </section>

          {/* درباره غرفه */}
          <section className="mb-8 bg-gradient-to-l from-white to-[#edf2fa] rounded-[2rem] border-4 border-white shadow-[0_10px_30px_rgba(15,45,75,0.10)] overflow-hidden">
            <div className="flex items-center gap-4 p-5 sm:p-7">
              <div className="hidden sm:flex w-28 h-24 rounded-2xl bg-gradient-to-br from-amber-50 to-white items-center justify-center text-amber-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                  درباره غرفه
                  <span className="text-amber-600">ⓘ</span>
                </h3>
                <p className="text-slate-600 leading-8 text-sm sm:text-base">
                  {store.description || 'توضیحاتی برای این غرفه ثبت نشده است.'}
                </p>
              </div>
            </div>
          </section>

          {/* آدرس و اطلاعات تماس */}
          {(store.address || store.phone_number) && (
            <section className="mb-8 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 mb-1">آدرس و اطلاعات تماس</p>
                <p className="text-sm text-slate-600 break-words">{store.address || 'آدرسی ثبت نشده است.'}</p>
                {store.phone_number && <p className="text-sm text-slate-500 mt-1" dir="ltr">{store.phone_number}</p>}
              </div>
            </section>
          )}

          {/* عنوان و جستجوی محصولات */}
          <section className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 whitespace-nowrap">محصولات غرفه</h3>
                <div className="hidden sm:block h-1 w-24 rounded-full bg-gradient-to-l from-amber-500 to-amber-100" />
              </div>

              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="جستجو در محصولات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-5 py-3 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-700 pr-11"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </section>

          {products.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-slate-100 text-slate-500 mb-12">
              <div className="text-4xl mb-3">🛍️</div>
              <p className="font-bold">این غرفه هنوز محصولی ثبت نکرده است.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-3xl shadow-sm border border-slate-100 text-slate-500 mb-12">
              محصولی با این عبارت پیدا نشد.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-5 gap-y-6 sm:gap-y-8 mb-16 pt-2">
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
                    onAddToCart={handleAddToCartClick}
                  />
                )
              })}
            </div>
          )}

          {/* نظرات محصولات */}
          <div id="store-reviews" className="h-1" />

        </main>
      </div>

      {/* پنجره تعطیلی غرفه */}
      {isClosed && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 pointer-events-auto bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl border border-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">فروشگاه تعطیل است</h2>
            <p className="text-slate-600 font-bold leading-relaxed text-sm mb-4">{closureMessage}</p>

            {hasClosureTimer && (
              <div className="bg-slate-100 rounded-2xl p-4 mb-6 border border-slate-200" dir="ltr">
                <p className="text-xs text-slate-500 mb-2 font-bold">زمان باقی‌مانده تا بازگشایی</p>
                <div className="flex items-center justify-center gap-2 font-mono font-black text-2xl text-slate-700">
                  <div className="flex flex-col items-center"><span>{String(closureTimeLeft.d).padStart(2, '0')}</span><span className="text-[10px] text-slate-400">روز</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span>{String(closureTimeLeft.h).padStart(2, '0')}</span><span className="text-[10px] text-slate-400">ساعت</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span>{String(closureTimeLeft.m).padStart(2, '0')}</span><span className="text-[10px] text-slate-400">دقیقه</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span>{String(closureTimeLeft.s).padStart(2, '0')}</span><span className="text-[10px] text-slate-400">ثانیه</span></div>
                </div>
              </div>
            )}

            <Link href="/" className="inline-block bg-gradient-to-l from-[#0b527c] to-[#062b4a] text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-md">
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  )
}