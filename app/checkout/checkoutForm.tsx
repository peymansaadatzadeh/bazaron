'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapEventsHandler({ setPosition }: { setPosition: (pos: { lat: number, lng: number }) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return null;
}

function MapRefSaver({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

const calculateCommission = (subtotal: number) => {
  let commission = 0;
  if (subtotal <= 2000000) commission = subtotal * 0.05;
  else if (subtotal <= 4000000) commission = (2000000 * 0.05) + ((subtotal - 2000000) * 0.04);
  else if (subtotal <= 6000000) commission = (2000000 * 0.05) + (2000000 * 0.04) + ((subtotal - 4000000) * 0.03);
  else commission = (2000000 * 0.05) + (2000000 * 0.04) + (2000000 * 0.03) + ((subtotal - 6000000) * 0.02);
  return commission;
}

export default function UnifiedCheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const baseShippingFee = Number(searchParams.get('shipping')) || 50000

  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [isFirstOrder, setIsFirstOrder] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')

  const [mounted, setMounted] = useState(false)
  const [location, setLocation] = useState({ lat: 36.696, lng: 53.536 })
  const mapRef = useRef<L.Map | null>(null)

  const [errors, setErrors] = useState({
    firstName: '', lastName: '', phone: '', address: '', auth: ''
  })

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
      const data = localStorage.getItem('marketplace_cart')
      if (!data || Object.keys(JSON.parse(data)).length === 0) {
        router.push('/cart')
        return
      }
      setCart(JSON.parse(data))

      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setSessionUser(session.user)
        
        const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('customer_id', session.user.id)
        if (count === 0) setIsFirstOrder(true)

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (profile) {
          if (profile.first_name) setFirstName(profile.first_name)
          if (profile.last_name) setLastName(profile.last_name)
          else if (profile.full_name) {
            const parts = profile.full_name.split(' ')
            setFirstName(parts[0] || '')
            setLastName(parts.slice(1).join(' ') || '')
          }
          if (profile.phone_number) setReceiverPhone(profile.phone_number)
          if (profile.address) setShippingAddress(`${profile.city ? profile.city + '، ' : ''}${profile.address}`)
        }
      } else {
        setSessionUser(null)
      }
      
      setLoading(false)
    }
    loadData()
  }, [router])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setReceiverPhone(value)
    if (errors.phone) setErrors({ ...errors, phone: '' })
  }

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('مرورگر شما از قابلیت موقعیت‌یابی پشتیبانی نمی‌کند.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        mapRef.current?.flyTo([latitude, longitude], 16);
      },
      (err) => alert('خطا در دریافت موقعیت مکانی. لطفاً دسترسی به GPS را بررسی کنید.'),
      { enableHighAccuracy: true }
    );
  };

  const validateForm = () => {
    let tempErrors = { firstName: '', lastName: '', phone: '', address: '', auth: '' }
    let isValid = true

    if (!firstName.trim()) { tempErrors.firstName = 'وارد کردن نام الزامی است.'; isValid = false }
    if (!lastName.trim()) { tempErrors.lastName = 'وارد کردن نام خانوادگی الزامی است.'; isValid = false }
    if (!/^09\d{9}$/.test(receiverPhone)) { tempErrors.phone = 'شماره تماس باید ۱۱ رقم بوده و با 09 شروع شود.'; isValid = false }
    if (shippingAddress.trim().length < 10) { tempErrors.address = 'آدرس باید حداقل ۱۰ حرف باشد.'; isValid = false }

    setErrors(tempErrors)
    return isValid
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setErrors(prev => ({ ...prev, auth: 'خطا: برای ارسال درخواست ابتدا باید ثبت‌نام کنید یا وارد حساب خود شوید.' }))
      return
    }

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const fullName = `${firstName} ${lastName}`.trim()

      await supabase.from('profiles').update({
        first_name: firstName, last_name: lastName, full_name: fullName,
        phone_number: receiverPhone, address: shippingAddress
      }).eq('id', session.user.id)

      const paymentGroupId = crypto.randomUUID()
      const storeIds = Object.keys(cart)
      const actualShippingFee = isFirstOrder ? 0 : baseShippingFee
      
      let isFirstOrderLoop = true

      for (const storeId of storeIds) {
        const storeData = cart[storeId]
        const subtotal = storeData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        
        const currentShippingFee = isFirstOrderLoop ? actualShippingFee : 0
        isFirstOrderLoop = false

        const totalAmount = subtotal + currentShippingFee
        const commissionAmount = calculateCommission(subtotal);
        const commissionRate = subtotal > 0 ? (commissionAmount / subtotal) : 0;
        const sellerNetAmount = subtotal - commissionAmount

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            customer_id: session.user.id, store_id: storeId, status: 'pending_admin_review',
            payment_group_id: paymentGroupId, subtotal: subtotal, shipping_cost: currentShippingFee,
            total_amount: totalAmount, commission_rate: commissionRate, commission_amount: commissionAmount,
            seller_net_amount: sellerNetAmount, shipping_address: shippingAddress,
            receiver_name: fullName, receiver_phone: receiverPhone,
            latitude: location.lat, longitude: location.lng
          }]).select().single()

        if (orderError) throw new Error(`خطا در ثبت فاکتور: ${orderError.message}`)

        const itemsToInsert = storeData.items.map((item: any) => ({
          order_id: orderData.id, product_id: item.id, product_title: item.title,
          quantity: item.quantity, unit_price: item.price, total_price: item.price * item.quantity,
          item_status: 'available'
        }))

        const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)
        if (itemsError) throw new Error(`خطا در ثبت آیتم‌ها: ${itemsError.message}`)
      }

      localStorage.removeItem('marketplace_cart')
      setShowSuccessModal(true)

    } catch (error: any) {
      alert(error.message)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>
  if (!cart) return null

  let totalProductsPrice = 0
  Object.keys(cart).forEach(storeId => {
    cart[storeId].items.forEach((item: any) => { totalProductsPrice += item.price * item.quantity })
  })
  
  const finalShippingFee = isFirstOrder ? 0 : baseShippingFee
  const finalTotal = totalProductsPrice + finalShippingFee

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8 relative">
      
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">فاکتور شما ثبت شد</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              فاکتور شما برای استعلام موجودی به پشتیبانی ارسال شد و حداکثر تا نیم ساعت دیگر نتیجه برای شما ارسال می‌شود. لطفاً پنل کاربری خود را چک کنید.
            </p>
            <Link href="/dashboard/my-orders" className="w-full block bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
              مشاهده پنل کاربری و سفارش‌ها
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800">تکمیل اطلاعات ارسال</h1>
          </div>

          {!sessionUser && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 p-6 rounded-2xl mb-8 flex flex-col items-center text-center">
              <div className="bg-red-100 p-3 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="font-bold text-lg mb-2">شما وارد حساب کاربری خود نشده‌اید</h3>
              <p className="text-sm mb-6 max-w-sm leading-relaxed">برای تکمیل فرم و ارسال سفارش، ابتدا باید وارد حساب خود شوید یا ثبت‌نام کنید.</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <Link href={`/login?redirect=${encodeURIComponent(`/checkout?shipping=${baseShippingFee}`)}`} className="bg-red-600 text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-red-700 transition-all w-full sm:w-auto">ورود به حساب</Link>
                <Link href={`/register?redirect=${encodeURIComponent(`/checkout?shipping=${baseShippingFee}`)}`} className="bg-white text-red-600 border-2 border-red-600 px-8 py-3 rounded-full text-sm font-bold hover:bg-red-50 transition-all w-full sm:w-auto">ثبت‌نام</Link>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmitOrder} noValidate className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-bold text-gray-700 mb-2">نام گیرنده *</label>
                <input type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value); if (errors.firstName) setErrors({ ...errors, firstName: '' }) }} disabled={!sessionUser} className={`w-full bg-gray-50 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed ${errors.firstName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`} placeholder="مثلاً: پیمان" />
                {errors.firstName && <p className="text-red-500 text-xs mt-1 font-bold">{errors.firstName}</p>}
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-bold text-gray-700 mb-2">نام خانوادگی گیرنده *</label>
                <input type="text" value={lastName} onChange={(e) => { setLastName(e.target.value); if (errors.lastName) setErrors({ ...errors, lastName: '' }) }} disabled={!sessionUser} className={`w-full bg-gray-50 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed ${errors.lastName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`} placeholder="مثلاً: صادق‌زاده" />
                {errors.lastName && <p className="text-red-500 text-xs mt-1 font-bold">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">شماره تلفن همراه *</label>
              <input type="tel" value={receiverPhone} onChange={handlePhoneChange} disabled={!sessionUser} className={`w-full bg-gray-50 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`} dir="ltr" placeholder="09123456789" maxLength={11} />
              {errors.phone ? (<p className="text-red-500 text-xs mt-1 font-bold">{errors.phone}</p>) : (<p className="text-xs text-gray-400 mt-1">شماره باید با 09 شروع شده و ۱۱ رقم باشد.</p>)}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">آدرس کامل پستی *</label>
              <textarea value={shippingAddress} onChange={(e) => { setShippingAddress(e.target.value); if (errors.address) setErrors({ ...errors, address: '' }) }} disabled={!sessionUser} rows={3} className={`w-full bg-gray-50 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed ${errors.address ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`} placeholder="استان، شهر، خیابان، کوچه، پلاک و واحد..." />
              {errors.address && <p className="text-red-500 text-xs mt-1 font-bold">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">موقعیت دقیق شما روی نقشه *</label>
              <p className="text-xs text-gray-500 mb-2">لطفاً پین را دقیقاً روی محل سکونت خود تنظیم کنید، یا روی دکمه موقعیت فعلی کلیک کنید.</p>
              
              <div className="relative w-full h-[250px] rounded-xl overflow-hidden border border-gray-200 z-0">
                {mounted && (
                  <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                    <Marker position={[location.lat, location.lng]} />
                    <MapEventsHandler setPosition={setLocation} />
                    <MapRefSaver mapRef={mapRef} />
                  </MapContainer>
                )}
                
                <button
                  type="button"
                  onClick={handleLocate}
                  className="absolute top-3 right-3 z-[1000] bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-indigo-600 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
                  title="موقعیت فعلی من"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="pt-4">
              <button type="submit" disabled={submitting || !sessionUser} className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-xl hover:shadow-lg font-bold text-lg disabled:from-gray-300 disabled:to-gray-400 transition-all transform hover:-translate-y-0.5">
                {submitting ? 'در حال ارسال برای بررسی...' : 'ارسال برای بررسی موجودی'}
              </button>
              {errors.auth && <p className="text-center mt-4 font-bold p-3 rounded-xl text-red-600 bg-red-50">{errors.auth}</p>}
            </div>
          </form>
        </div>

        <div className="w-full md:w-1/3 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-28">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-gray-800">خلاصه فاکتور</h2>
          <div className="text-sm text-gray-500 mb-4">تعداد غرفه‌ها: {Object.keys(cart).length}</div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm"><span className="text-gray-600">مبلغ محصولات:</span><span className="font-bold">{totalProductsPrice.toLocaleString()}</span></div>
            
            {finalShippingFee > 0 ? (
              <div className="flex justify-between text-sm"><span className="text-gray-600">هزینه ارسال:</span><span className="font-bold text-orange-600">{finalShippingFee.toLocaleString()}</span></div>
            ) : (
              <div className="flex justify-between text-sm"><span className="text-green-600 font-bold">هزینه ارسال:</span><span className="font-bold text-green-600">ارسال رایگان (اولین خرید)</span></div>
            )}
          </div>
          
          <div className="border-t pt-4 flex justify-between items-center text-lg font-bold bg-gray-50 p-4 rounded-xl">
            <span className="text-gray-800">مبلغ نهایی:</span>
            <span className="text-indigo-600 text-xl">{finalTotal.toLocaleString()} <span className="text-xs font-normal">تومان</span></span>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
      `}</style>
    </div>
  )
}