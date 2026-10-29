'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// کامپوننت ستاره‌ها (دقیقاً مثل قبل)
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

  const [store, setStore] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [productReviews, setProductReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showShippingWarning, setShowShippingWarning] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<any>(null)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
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
      setLoading(false)
    }
    if (storeId) fetchStoreData()
  }, [storeId])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleAddToCartClick = (product: any) => {
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
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 animate-fade-in-down">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {toastMessage}
        </div>
      )}

      {/* Shipping Warning Modal */}
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

      <header className="bg-white shadow-sm py-4 mb-8">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-indigo-600 font-bold hover:underline">&rarr; بازگشت به صفحه اصلی</Link>
          <Link href="/cart" className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-200 font-bold">سبد خرید</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 text-4xl font-bold shrink-0 border border-indigo-100 overflow-hidden">
            {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" /> : store.name.charAt(0)}
          </div>
          <div className="text-center md:text-right flex-grow">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{store.name}</h2>
            <p className="text-gray-600 mb-4">{store.description || 'توضیحاتی ثبت نشده است.'}</p>
          </div>
          <div className="md:absolute md:left-6 md:top-1/2 md:-translate-y-1/2 mt-4 md:mt-0 w-full md:w-auto">
            <a href="#store-reviews" className="flex flex-col items-center justify-center bg-gray-50 hover:bg-indigo-50 p-3 rounded-2xl border border-gray-200 transition-colors cursor-pointer">
              <StarRating rating={avgStoreRating ? parseFloat(avgStoreRating) : null} />
              <span className="text-sm text-gray-600 font-bold mt-2">نظرها برای محصولات</span>
            </a>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4">محصولات این غرفه</h3>
        {products.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 mb-10">این غرفه هنوز محصولی ثبت نکرده است.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {products.map((product) => {
              const pReviews = productReviews.filter(r => r.product_id === product.id);
              const avgProductRating = pReviews.length > 0 ? (pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length) : null;
              return (
                <div key={product.id} className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow border border-gray-100">
                  <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden">
                    {product.image_url ? <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" /> : 'بدون عکس'}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h4 className="font-bold text-gray-800 mb-2 truncate">{product.title}</h4>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-indigo-600">{product.price.toLocaleString()} تومان</span>
                        {avgProductRating && <div className="flex items-center gap-1"><span className="text-yellow-500 text-lg">★</span><span className="font-bold text-gray-700 text-sm">{avgProductRating.toFixed(1)}</span></div>}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/product/${product.id}`} className="w-1/3 bg-gray-50 text-gray-700 py-2 rounded-xl text-center text-sm font-bold hover:bg-gray-200 transition-colors">جزئیات</Link>
                        <button onClick={() => handleAddToCartClick(product)} disabled={product.stock === 0} className="w-2/3 bg-indigo-50 text-indigo-700 py-2 rounded-xl hover:bg-indigo-600 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 transition-colors text-sm font-bold">{product.stock === 0 ? 'ناموجود' : 'افزودن به سبد'}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {/* بخش نظرات همونطور که بود بمونه */}
        <div id="store-reviews" className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 border-r-4 border-indigo-500 pr-3">نظرات کاربران در مورد محصولات</h2>
          {productReviews.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl"><p className="text-gray-500">هنوز هیچ نظری برای محصولات این غرفه ثبت نشده است.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productReviews.map((review) => (
                <div key={review.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">{review.reviewer_name ? review.reviewer_name.charAt(0) : 'ک'}</div>
                      <div>
                        <span className="font-bold text-gray-800 block">{review.reviewer_name || 'کاربر'}</span>
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full mt-1 inline-block">{review.products?.title}</span>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="w-3.5 h-3.5" />
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style jsx global>{`
        @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out forwards; }
      `}</style>
    </div>
  )
}