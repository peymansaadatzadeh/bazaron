
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

// آیکون ستاره
const SingleStar = ({ size = "w-3.5 h-3.5" }: { size?: string }) => (
  <svg className={`${size} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function ProductCard({ 
  product, 
  storeData, 
  isFavorite = false, 
  onToggleFavorite,
  onAddToCart
}: { 
  product: any, 
  storeData?: any, 
  isFavorite?: boolean, 
  onToggleFavorite?: (e: React.MouseEvent, id: string) => void,
  onAddToCart?: (e: React.MouseEvent, product: any) => void
}) {
  const currentStore = storeData || product.stores;
  const router = useRouter();
  
  // محاسبه تخفیف
  let hasDiscount = false;
  let finalPrice = product.price;
  let discountPercent = 0;

  if (currentStore && currentStore.discount_percentage > 0 && currentStore.discount_expires_at) {
    const isActive = new Date(currentStore.discount_expires_at) > new Date();
    const isCategoryMatch = currentStore.discount_category === 'all' || currentStore.discount_category === product.category;
    if (isActive && isCategoryMatch) {
      hasDiscount = true;
      discountPercent = currentStore.discount_percentage;
      finalPrice = product.price - (product.price * (discountPercent / 100));
    }
  }

  // محاسبه امتیاز
  let avgRating = null;
  if (product.reviews && Array.isArray(product.reviews)) {
    const approved = product.reviews.filter((r: any) => r.status === 'approved');
    if (approved.length > 0) {
      avgRating = (approved.reduce((sum: number, r: any) => sum + r.rating, 0) / approved.length).toFixed(1);
    }
  } else if (product.avgRating) {
    avgRating = product.avgRating; 
  }

  // هندل کردن کلیک روی سبد خرید
  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(e, product);
    } else {
      router.push(`/product/${product.id}`);
    }
  }

  return (
    <div className="relative w-full max-w-[250px] mx-auto group">
      
      {/* بدنه اصلی کارت */}
      <Link 
        href={`/product/${product.id}`} 
        className="block bg-white rounded-[28px] p-3 shadow-[0_2px_15px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 border border-gray-100 relative overflow-visible pb-10"
      >
        
        {/* کادر عکس */}
        <div className="relative aspect-square bg-gray-50 rounded-[22px] overflow-hidden w-full flex items-center justify-center">
          
          {/* برچسب تخفیف (بالا راست) */}
          {hasDiscount && (
            <div className="absolute top-2.5 right-2.5 z-20">
              <div className="bg-[#2e7d32] text-white px-2.5 py-1 rounded-lg shadow-sm">
                <span className="text-[11px] font-black">{discountPercent}٪ تخفیف</span>
              </div>
            </div>
          )}

          {/* دکمه علاقه‌مندی (بالا چپ) */}
          {onToggleFavorite && (
            <button 
              onClick={(e) => onToggleFavorite(e, product.id)} 
              className={`absolute top-2.5 left-2.5 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-sm ${isFavorite ? 'bg-white text-red-500' : 'bg-white/90 text-gray-400 hover:bg-white hover:text-red-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isFavorite ? 'fill-red-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}

          {/* عکس محصول */}
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        
        {/* بخش اطلاعات */}
        <div className="pt-3.5 px-1">
          <h4 className="font-bold text-gray-800 text-[15px] text-right w-full truncate leading-tight">
            {product.title}
          </h4>
          <p className="text-[11px] text-gray-400 text-right w-full truncate mt-1">
            {currentStore?.name}
          </p>
          
          {/* ردیف پایین: ستاره + دکمه + قیمت */}
          <div className="w-full flex items-center justify-between mt-5 relative">
            
            {/* ستاره و امتیاز (سمت چپ) - فقط اگر امتیاز وجود داشته باشد */}
            <div className="flex items-center gap-1 min-w-[60px]">
              {avgRating && (
                <>
                  <SingleStar size="w-4 h-4" />
                  <span className="text-[13px] text-gray-700 font-bold">{avgRating}</span>
                </>
              )}
            </div>

            {/* فضای خالی وسط برای دکمه */}
            <div className="w-16"></div>

            {/* قیمت (سمت راست) */}
            <div className="flex flex-col items-end min-w-[90px]">
              {hasDiscount ? (
                <>
                  {/* قیمت قبل از تخفیف - قرمز و کمی بزرگ‌تر */}
                  <span className="text-[12px] text-red-500 line-through font-medium">
                    {product.price.toLocaleString()}
                  </span>
                  {/* قیمت نهایی - مشکی (حالت قبلی) */}
                  <span className="font-black text-gray-900 text-[15px] leading-none">
                    {finalPrice.toLocaleString()}
                    <span className="text-[10px] font-medium text-gray-500 mr-1">تومان</span>
                  </span>
                </>
              ) : product.discount_price ? (
                <>
                  <span className="text-[12px] text-red-500 line-through font-medium">
                    {product.price.toLocaleString()}
                  </span>
                  <span className="font-black text-gray-900 text-[15px] leading-none">
                    {product.discount_price.toLocaleString()}
                    <span className="text-[10px] font-medium text-gray-500 mr-1">تومان</span>
                  </span>
                </>
              ) : (
                <span className="font-black text-gray-900 text-[15px] leading-none">
                  {product.price.toLocaleString()}
                  <span className="text-[10px] font-medium text-gray-500 mr-1">تومان</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* دکمه سبد خرید شناور (کمی بالاتر = بیشتر داخل کارت) */}
      <button 
        onClick={handleCartClick}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 bg-white text-gray-800 rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.18)] border border-gray-100 hover:bg-gray-900 hover:text-white transition-all duration-300 z-30"
        title="افزودن به سبد خرید"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </button>

    </div>
  )
}
