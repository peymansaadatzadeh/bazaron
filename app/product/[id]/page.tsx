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

export default function ProductPage() {
  const params = useParams()
  const productId = params.id as string
  const router = useRouter()

  const [product, setProduct] = useState<any>(null)
  const [store, setStore] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [activeImage, setActiveImage] = useState<string | null>(null)

  // استیت‌های پاپ‌آپ و پیام
  const [showShippingWarning, setShowShippingWarning] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<any>(null)
  const [toastMessage, setToastMessage] = useState('')

  const [user, setUser] = useState<any>(null)
  const [canReview, setCanReview] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  
  const [reviewerName, setReviewerName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: productData } = await supabase.from('products').select('*, product_images(*)').eq('id', productId).single()
      if (!productData) { setLoading(false); return }
      setProduct(productData)

      if (productData.product_images && productData.product_images.length > 0) {
        const main = productData.product_images.find((img: any) => img.is_main) || productData.product_images[0]
        setActiveImage(main.image_url)
      } else {
        setActiveImage(productData.image_url)
      }

      const { data: storeData } = await supabase.from('stores').select('*').eq('id', productData.store_id).single()
      if (storeData) setStore(storeData)

      const { data: reviewsData } = await supabase.from('reviews').select('*').eq('product_id', productId).eq('status', 'approved').order('created_at', { ascending: false })
      if (reviewsData) setReviews(reviewsData)

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        const { data: orders } = await supabase.from('orders').select('id, status, order_items!inner(product_id)').eq('customer_id', session.user.id).eq('status', 'delivered').eq('order_items.product_id', productId)
        if (orders && orders.length > 0) setCanReview(true)
        const { data: existingRev } = await supabase.from('reviews').select('id').eq('product_id', productId).eq('customer_id', session.user.id).maybeSingle()
        if (existingRev) setHasReviewed(true)
      }
      setLoading(false)
    }
    fetchData()
  }, [productId])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleAddToCartClick = () => {
    if (!product || !store) return
    const existingCartString = localStorage.getItem('marketplace_cart')
    let cartData = existingCartString ? JSON.parse(existingCartString) : {}
    const cartStoreIds = Object.keys(cartData)

    if (cartStoreIds.length === 0 || cartData[product.store_id]) {
      addToCartLogic();
    } else {
      setPendingProduct(product);
      setShowShippingWarning(true);
    }
  }

  const addToCartLogic = () => {
    const existingCartString = localStorage.getItem('marketplace_cart')
    let cartData = existingCartString ? JSON.parse(existingCartString) : {}

    if (!cartData[product.store_id]) {
      cartData[product.store_id] = { storeName: store.name, items: [] }
    }

    const existingItemIndex = cartData[product.store_id].items.findIndex((item: any) => item.id === product.id)
    if (existingItemIndex > -1) {
      cartData[product.store_id].items[existingItemIndex].quantity += 1
    } else {
      cartData[product.store_id].items.push({ id: product.id, title: product.title, price: product.price, quantity: 1 })
    }

    localStorage.setItem('marketplace_cart', JSON.stringify(cartData))
    showToast('محصول با موفقیت به سبد خرید اضافه شد!');
  }

  const handleConfirmAddWithFee = () => {
    addToCartLogic();
    setShowShippingWarning(false);
    setPendingProduct(null);
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitMessage('')
    const { error } = await supabase.from('reviews').insert([{ customer_id: user.id, product_id: productId, reviewer_name: reviewerName, rating: rating, comment: comment, status: 'pending' }])
    if (error) {
      setSubmitMessage(`خطا: ${error.message}`)
      setSubmitting(false)
    } else {
      setSubmitMessage('نظر شما با موفقیت ثبت شد و پس از تایید مدیر نمایش داده می‌شود.')
      setComment(''); setReviewerName(''); setRating(5); setSubmitting(false)
      setTimeout(() => setHasReviewed(true), 3000)
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>
  if (!product) return <div className="p-8 text-center text-red-600 font-bold">محصول یافت نشد!</div>

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* پیام شیک (Toast) */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-fade-in-down">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {toastMessage}
        </div>
      )}

      {/* پاپ‌آپ هشدار */}
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link href={`/store/${product.store_id}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium mb-6 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          بازگشت به غرفه {store?.name}
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 flex flex-col md:flex-row gap-10 mb-10 relative overflow-hidden">
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div className="h-80 md:h-96 bg-gray-50 rounded-2xl flex items-center justify-center relative group border border-gray-200 overflow-hidden">
              {activeImage ? <img src={activeImage} alt={product.title} className="w-full h-full object-contain" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            </div>
            {product.product_images && product.product_images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {product.product_images.map((img: any) => (
                  <button key={img.id} onClick={() => setActiveImage(img.image_url)} className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img.image_url ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 opacity-70 hover:opacity-100'}`}><img src={img.image_url} alt="thumbnail" className="w-full h-full object-cover" /></button>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <div>
              <h1 className="text-3xl font-black text-gray-800 mb-4 leading-tight">{product.title}</h1>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm md:text-base">{product.description}</p>
              {(product.size || product.color) && (
                <div className="flex gap-2 mb-6">
                  {product.size && <span className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm font-bold text-gray-700">سایز: {product.size}</span>}
                  {product.color && <span className="bg-white border border-gray-200 px-3 py-1 rounded-lg text-sm font-bold text-gray-700">رنگ: {product.color}</span>}
                </div>
              )}
              <div className="flex items-center gap-3 mb-8 bg-gray-50 w-fit px-4 py-2 rounded-xl border border-gray-100">
                {avgRating ? (<><StarRating rating={parseFloat(avgRating)} size="w-5 h-5" /><span className="font-bold text-lg text-gray-800 mr-2">{avgRating}</span><span className="text-sm text-gray-500">({reviews.length} نظر)</span></>) : (<span className="text-sm text-gray-500">هنوز امتیازی ثبت نشده است.</span>)}
              </div>
            </div>

            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 mt-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  {product.discount_price ? (<><span className="text-sm text-gray-400 line-through">{product.price.toLocaleString()}</span><span className="font-black text-3xl text-green-600">{product.discount_price.toLocaleString()} <span className="text-sm font-medium text-gray-500">تومان</span></span></>) : (<span className="font-black text-3xl text-indigo-600">{product.price.toLocaleString()} <span className="text-sm font-medium text-gray-500">تومان</span></span>)}
                </div>
                <span className={`text-sm px-3 py-1 rounded-full font-bold ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.stock > 0 ? `موجودی: ${product.stock}` : 'ناموجود'}</span>
              </div>
              <button onClick={handleAddToCartClick} disabled={product.stock === 0} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none font-bold text-lg transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {product.stock === 0 ? 'ناموجود' : 'افزودن به سبد خرید'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 border-r-4 border-indigo-500 pr-3">نظرات کاربران</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 sticky top-28">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>ثبت نظر شما</h3>
                {!user ? (<div className="text-center py-4"><p className="text-gray-600 text-sm mb-3">برای ثبت نظر ابتدا وارد حساب خود شوید.</p><Link href="/login" className="inline-block bg-white border border-gray-200 text-gray-700 font-bold px-6 py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm">ورود به حساب</Link></div>) : !canReview ? (<p className="text-gray-500 text-sm text-center bg-white p-4 rounded-xl border border-gray-100">فقط خریدارانی که این محصول را تحویل گرفته‌اند می‌توانند نظر ثبت کنند.</p>) : hasReviewed ? (<div className="text-green-700 text-sm font-bold bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>شما قبلاً برای این محصول نظر ثبت کرده‌اید.</div>) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">نام شما (نمایش برای دیگران):</label><input type="text" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} required className="w-full border-gray-200 border p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="مثلاً: علی رضایی" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">امتیاز شما:</label><select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full border-gray-200 border p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"><option value={5}>۵ - عالی</option><option value={4}>۴ - خوب</option><option value={3}>۳ - متوسط</option><option value={2}>۲ - ضعیف</option><option value={1}>۱ - بد</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">متن نظر:</label><textarea value={comment} onChange={(e) => setComment(e.target.value)} required rows={4} className="w-full border-gray-200 border p-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="نظر خود را بنویسید..."></textarea></div>
                    <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 font-bold transition-all transform hover:-translate-y-0.5">{submitting ? 'در حال ارسال...' : 'ثبت نظر'}</button>
                    {submitMessage && <p className={`text-sm font-bold text-center mt-2 ${submitMessage.includes('خطا') ? 'text-red-600' : 'text-green-600'}`}>{submitMessage}</p>}
                  </form>
                )}
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {reviews.length === 0 ? (<div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg><p className="text-gray-500 font-medium">هنوز نظری برای این محصول ثبت نشده است.</p></div>) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">{review.reviewer_name ? review.reviewer_name.charAt(0) : 'ک'}</div><div><span className="font-bold text-gray-800 block">{review.reviewer_name || 'کاربر'}</span><span className="text-xs text-gray-400">خریدار محصول</span></div></div>
                      <StarRating rating={review.rating} size="w-4 h-4" />
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; }
      `}</style>
    </div>
  )
}