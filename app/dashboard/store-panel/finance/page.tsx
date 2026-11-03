'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function SellerFinancePage() {
  const [wallet, setWallet] = useState<any>(null)
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFinanceData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // پیدا کردن غرفه
      const { data: storeData } = await supabase.from('stores').select('id').eq('owner_id', session.user.id).maybeSingle()
      if (!storeData) return

      // گرفتن کیف پول
      const { data: walletData } = await supabase.from('wallets').select('*').eq('store_id', storeData.id).maybeSingle()
      if (walletData) setWallet(walletData)

      // گرفتن تاریخچه فروش (سفارش‌های پرداخت شده)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('store_id', storeData.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })

      if (ordersData) setSales(ordersData)
      setLoading(false)
    }
    fetchFinanceData()
  }, [router])

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* باکس کیف پول */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-3xl p-8 shadow-lg text-white flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold mb-2 opacity-90">موجودی کیف پول شما</h2>
          <p className="text-5xl font-black mb-2">
            {wallet ? wallet.balance.toLocaleString() : 0} <span className="text-xl font-normal">تومان</span>
          </p>
          <p className="text-sm opacity-80">این مبلغ از فروش‌های تایید شده شما به دست آمده است.</p>
        </div>

        {/* تاریخچه فروش */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">تاریخچه فروش و تسویه</h3>
          </div>
          
          {sales.length === 0 ? (
            <div className="p-12 text-center text-gray-500">هنوز فروشی ثبت نکرده‌اید.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <div key={sale.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  
                  {/* هدر فاکتور */}
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <span className="font-mono text-sm font-bold text-indigo-600">کد فاکتور: {sale.id.split('-')[0].toUpperCase()}</span>
                    <span className="text-sm text-gray-500">{new Date(sale.created_at).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  {/* لیست محصولات فروخته شده */}
                  <div className="space-y-2 mb-4">
                    {sale.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{item.product_title}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{item.quantity} عدد</span>
                        </div>
                        <div className="text-left flex gap-4">
                          <span className="text-xs text-gray-400">{item.unit_price.toLocaleString()} × {item.quantity}</span>
                          <span className="font-bold text-gray-700">{item.total_price.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* خلاصه مالی این فاکتور */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-600">مبلغ کل کالاها: <strong className="text-gray-800">{sale.subtotal.toLocaleString()}</strong></span>
                      <span className="text-red-500">کمیسیون کسر شده ({sale.commission_rate * 100}٪): <strong>-{sale.commission_amount.toLocaleString()}</strong></span>
                    </div>
                    <div className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">
                      خالص واریزی به کیف پول: {sale.seller_net_amount.toLocaleString()} تومان
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}