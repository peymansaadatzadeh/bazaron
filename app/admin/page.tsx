'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  const [stats, setStats] = useState({
    todaySales: 0, ordersPendingReview: 0, ordersPendingPayment: 0, ordersReadyToShip: 0,
    productsPending: 0, sellersPending: 0, reviewsPending: 0, withdrawalsPending: 0
  })

  const [chartData, setChartData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const [
        ordersReviewRes, ordersPaymentRes, ordersPaidRes, 
        productsRes, storesRes, reviewsRes, withdrawalsRes, 
        salesTodayRes, lastWeekOrdersRes, visitsRes
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_admin_review'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_payment'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
        supabase.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('is_suspended', false),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('total_amount').in('status', ['paid', 'shipped', 'delivered']).gte('created_at', startOfToday.toISOString()),
        supabase.from('orders').select('created_at, total_amount, commission_amount').in('status', ['paid', 'shipped', 'delivered']).gte('created_at', sevenDaysAgo.toISOString()),
        supabase.from('site_visits').select('*').gte('visit_date', sevenDaysAgo.toISOString().split('T')[0])
      ])

      const todaySales = salesTodayRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      const daysMap: any = {}
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(d.getDate() + i)
        const dateStr = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('fa-IR', { weekday: 'short' })
        daysMap[dateStr] = { name: label, sales: 0, commission: 0, visits: 0, fullDate: dateStr }
      }

      lastWeekOrdersRes.data?.forEach(order => {
        const dateStr = order.created_at.split('T')[0]
        if (daysMap[dateStr]) {
          daysMap[dateStr].sales += (order.total_amount || 0)
          daysMap[dateStr].commission += (order.commission_amount || 0)
        }
      })

      visitsRes.data?.forEach(visit => {
        if (daysMap[visit.visit_date]) daysMap[visit.visit_date].visits = visit.count
      })

      setChartData(Object.values(daysMap))

      const { data: topProds } = await supabase.from('order_items').select('product_title, quantity').limit(100)
      const prodCounts: any = {}
      topProds?.forEach(item => { prodCounts[item.product_title] = (prodCounts[item.product_title] || 0) + item.quantity })
      const sortedProds = Object.keys(prodCounts).map(title => ({ name: title, value: prodCounts[title] })).sort((a, b) => b.value - a.value).slice(0, 5)
      setTopProducts(sortedProds)

      setStats({
        todaySales, ordersPendingReview: ordersReviewRes.count || 0, ordersPendingPayment: ordersPaymentRes.count || 0,
        ordersReadyToShip: ordersPaidRes.count || 0, productsPending: productsRes.count || 0,
        sellersPending: storesRes.count || 0, reviewsPending: reviewsRes.count || 0, withdrawalsPending: withdrawalsRes.count || 0
      })
      setLoading(false)
    }
    fetchDashboardData()
  }, [router])

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  const todayDate = new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const ActionBox = ({ title, count, href, icon, colorClass, badgeClass }: any) => {
    const isActive = count > 0;
    return (
      <Link href={isActive ? href : '#'} className={`relative rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between h-36 border-2 ${isActive ? `${colorClass} shadow-md hover:shadow-xl hover:-translate-y-1 cursor-pointer` : 'bg-gray-50 border-gray-100 text-gray-400 opacity-70 cursor-not-allowed grayscale'}`}>
        {isActive && <div className={`absolute -top-2.5 -right-2.5 w-7 h-7 ${badgeClass} text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg animate-bounce`}>{count}</div>}
        <div className="flex justify-between items-start w-full"><div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/60' : 'bg-gray-200'}`}>{icon}</div>{isActive && <span className="text-[10px] font-bold bg-white/70 px-2 py-1 rounded-lg">جدید</span>}</div>
        <h3 className="font-bold text-sm mt-3">{title}</h3>
      </Link>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6" dir="rtl">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10"></div>
        <div className="relative z-10"><h1 className="text-3xl font-black text-gray-800 mb-2">سلام، خوش آمدید! 👋</h1><p className="text-gray-500 font-medium">امروز {todayDate} است. وضعیت سایت را از اینجا مدیریت کنید.</p></div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-3xl p-8 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div><h2 className="text-lg font-bold mb-2 opacity-90 flex items-center gap-2">فروش امروز سایت</h2><p className="text-sm opacity-80">مجموع مبالغ واریز شده به سایت از ساعت ۰۰:۰۰ امروز تاکنون</p></div>
          <div className="bg-black/20 py-4 px-8 rounded-2xl backdrop-blur-md border border-white/10 text-center min-w-[250px]"><span className="text-4xl md:text-5xl font-black">{stats.todaySales.toLocaleString()} <span className="text-lg font-normal opacity-80">تومان</span></span></div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-r-4 border-blue-500 pr-3">مدیریت سفارشات</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionBox title="در انتظار بررسی" count={stats.ordersPendingReview} href="/admin/orders?tab=pending_admin_review" colorClass="bg-blue-50 border-blue-200 text-blue-700" badgeClass="bg-blue-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <ActionBox title="در انتظار پرداخت" count={stats.ordersPendingPayment} href="/admin/orders?tab=pending_payment" colorClass="bg-cyan-50 border-cyan-200 text-cyan-700" badgeClass="bg-cyan-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
          <ActionBox title="آماده ارسال" count={stats.ordersReadyToShip} href="/admin/orders?tab=paid" colorClass="bg-teal-50 border-teal-200 text-teal-700" badgeClass="bg-teal-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-r-4 border-orange-500 pr-3">سایر بخش‌ها</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionBox title="محصولات در انتظار تایید" count={stats.productsPending} href="/admin/products?tab=pending_approval" colorClass="bg-green-50 border-green-200 text-green-700" badgeClass="bg-green-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
          <ActionBox title="فروشندگان در انتظار" count={stats.sellersPending} href="/admin/sellers?tab=pending" colorClass="bg-orange-50 border-orange-200 text-orange-700" badgeClass="bg-orange-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
          <ActionBox title="نظرات در انتظار" count={stats.reviewsPending} href="/admin/reviews?tab=pending" colorClass="bg-purple-50 border-purple-200 text-purple-700" badgeClass="bg-purple-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} />
          <ActionBox title="تسویه‌های در انتظار" count={stats.withdrawalsPending} href="/admin/withdrawals?tab=pending" colorClass="bg-rose-50 border-rose-200 text-rose-700" badgeClass="bg-rose-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        </div>
      </div>

      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">تحلیل و آمار (۷ روز اخیر)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">روند فروش (تومان)</h3>
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/><stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(value: any) => [`${Number(value).toLocaleString()} تومان`, 'فروش']} /><Area type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">درآمد از کمیسیون (تومان)</h3>
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(value: any) => [`${Number(value).toLocaleString()} تومان`, 'کمیسیون']} cursor={{fill: '#f9fafb'}} /><Bar dataKey="commission" fill="#10B981" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">بازدید از سایت (نفرات)</h3>
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs><linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(value: any) => [`${Number(value).toLocaleString()} بازدید`, 'بازدید']} /><Area type="monotone" dataKey="visits" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">۵ محصول پرفروش</h3>
            <div className="h-72 w-full flex items-center justify-center" dir="ltr">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topProducts} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" 
                      label={({ name, percent }) => `${name ? name.substring(0, 15) : ''}... (${percent ? (percent * 100).toFixed(0) : 0}%)`} 
                      labelLine={true}>
                      {topProducts.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(value: any) => [`${value} عدد`, 'تعداد فروش']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (<p className="text-gray-400">داده‌ای برای نمایش وجود ندارد</p>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
