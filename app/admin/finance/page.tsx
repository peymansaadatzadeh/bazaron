'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminFinancePage() {
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalProducts: 0,
    totalCommission: 0,
    totalShipping: 0,
    totalDelivery: 0,
    totalCollection: 0,
    totalSellerNet: 0,
    ordersCount: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFinanceStats = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['paid', 'shipped', 'delivered'])

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      const groupedOrders: any = {}
      ordersData.forEach(o => {
        const gid = o.payment_group_id || o.id
        if (!groupedOrders[gid]) groupedOrders[gid] = []
        groupedOrders[gid].push(o)
      })

      let totalReceived = 0
      let totalProducts = 0
      let totalCommission = 0
      let totalShipping = 0
      let totalDelivery = 0
      let totalCollection = 0
      let totalSellerNet = 0

      const EXTRA_STORE_FEE = 30000

      Object.values(groupedOrders).forEach((group: any) => {
        const extraStores = group.length > 1 ? group.length - 1 : 0
        const collectionFeeForGroup = extraStores * EXTRA_STORE_FEE
        const shippingFeeForGroup = group.reduce((sum: number, o: any) => sum + (o.shipping_cost || 0), 0)
        const deliveryFeeForGroup = shippingFeeForGroup - collectionFeeForGroup

        totalCollection += collectionFeeForGroup
        totalShipping += shippingFeeForGroup
        totalDelivery += deliveryFeeForGroup

        group.forEach((o: any) => {
          totalReceived += (o.total_amount || 0)
          totalProducts += (o.subtotal || 0)
          totalCommission += (o.commission_amount || 0)
          totalSellerNet += (o.seller_net_amount || 0)
        })
      })

      setStats({
        totalReceived,
        totalProducts,
        totalCommission,
        totalShipping,
        totalDelivery,
        totalCollection,
        totalSellerNet,
        ordersCount: Object.keys(groupedOrders).length
      })
      
      setLoading(false)
    }

    fetchFinanceStats()
  }, [router])

  if (loading) return <div className="text-center py-20 text-gray-500">در حال محاسبه گزارش‌های مالی...</div>

  return (
    <div className="space-y-8">
      
      {/* هدر صفحه */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">گزارش‌های مالی پلتفرم</h1>
          <p className="text-gray-500 text-sm mt-1">خلاصه گردش مالی سایت (بر اساس {stats.ordersCount} فاکتور موفق)</p>
        </div>
      </div>

      {/* 🌟 ردیف اصلی: کل دریافتی از فاکتورها (طرح جدید و رنگ بنفش) */}
      <div className="bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-800 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
        {/* افکت‌های نوری پس‌زمینه */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-20 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">کل دریافتی از فاکتورها</h3>
              <p className="text-sm text-purple-100">مجموع مبلغ پرداختی مشتری‌ها (شامل ارزش محصولات + کرایه + جمع‌آوری)</p>
            </div>
          </div>
          
          <div className="bg-black/25 py-3 px-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner text-center w-full md:w-auto">
            <p className="text-4xl md:text-5xl font-black tracking-tight">{stats.totalReceived.toLocaleString()} <span className="text-lg font-normal opacity-80">تومان</span></p>
          </div>
        </div>
      </div>

      {/* ردیف اول: ارزش محصولات، کمیسیون، تعهد به فروشنده */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ۱. جمع ارزش کلی محصولات (سفید) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 mb-2">جمع ارزش کلی محصولات</h3>
          <p className="text-3xl font-black text-gray-800">{stats.totalProducts.toLocaleString()} <span className="text-sm font-normal text-gray-400">تومان</span></p>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">قیمت خام محصولات (بدون هزینه ارسال/جمع‌آوری و بدون کسر کمیسیون)</p>
        </div>

        {/* ۲. سود پلتفرم (سبز کم‌رنگ) */}
        <div className="bg-green-50 rounded-3xl p-6 shadow-sm border border-green-200">
          <h3 className="text-sm font-bold text-green-700 mb-2">سود پلتفرم (کمیسیون ۱۰٪)</h3>
          <p className="text-3xl font-black text-green-600">{stats.totalCommission.toLocaleString()} <span className="text-sm font-normal text-gray-400">تومان</span></p>
          <p className="text-xs text-green-600/70 mt-4 leading-relaxed">کسر شده از فروشندگان و باقی‌مانده در حساب سایت</p>
        </div>

        {/* ۳. تعهد به فروشندگان (آبی کم‌رنگ) */}
        <div className="bg-blue-50 rounded-3xl p-6 shadow-sm border border-blue-200">
          <h3 className="text-sm font-bold text-blue-700 mb-2">تعهد به فروشندگان (سود خالص آن‌ها)</h3>
          <p className="text-3xl font-black text-blue-600">{stats.totalSellerNet.toLocaleString()} <span className="text-sm font-normal text-gray-400">تومان</span></p>
          <p className="text-xs text-blue-600/70 mt-4 leading-relaxed">مجموع پولی که به کیف پول فروشندگان واریز شده است</p>
        </div>

      </div>

      {/* ردیف دوم: تفکیک هزینه‌های ارسال و جمع‌آوری */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-r-4 border-orange-500 pr-3">تفکیک هزینه‌های ارسال و جمع‌آوری</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100">
            <h3 className="text-sm font-bold text-orange-600 mb-2">کل هزینه جمع‌آوری</h3>
            <p className="text-2xl font-black text-gray-800">{stats.totalCollection.toLocaleString()} <span className="text-sm font-normal text-gray-400">تومان</span></p>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">دریافتی بابت زحمت پیک برای جمع کردن محصولات از چند غرفه مختلف (۳۰,۰۰۰ تومان برای هر غرفه اضافه).</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-purple-100">
            <h3 className="text-sm font-bold text-purple-600 mb-2">کل کرایه / هزینه ارسال</h3>
            <p className="text-2xl font-black text-gray-800">{stats.totalDelivery.toLocaleString()} <span className="text-sm font-normal text-gray-400">تومان</span></p>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">دریافتی بابت ارسال محصولات به دست مشتری (پس از کسر مبالغ جمع‌آوری).</p>
          </div>

          <div className="bg-gray-50 rounded-3xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2">جمع کل هزینه ارسال + جمع‌آوری</h3>
            <p className="text-2xl font-black text-gray-800">{stats.totalShipping.toLocaleString()} <span className="text-sm font-normal text-gray-400">تومان</span></p>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">مجموع مبالغی که بابت لجستیک و پیک در فاکتورها از مشتری دریافت شده است.</p>
          </div>

        </div>
      </div>

    </div>
  )
}