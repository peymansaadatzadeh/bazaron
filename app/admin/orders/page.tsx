'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

const calculateCommission = (subtotal: number) => {
  let commission = 0;
  if (subtotal <= 2000000) commission = subtotal * 0.05;
  else if (subtotal <= 4000000) commission = (2000000 * 0.05) + ((subtotal - 2000000) * 0.04);
  else if (subtotal <= 6000000) commission = (2000000 * 0.05) + (2000000 * 0.04) + ((subtotal - 4000000) * 0.03);
  else commission = (2000000 * 0.05) + (2000000 * 0.04) + (2000000 * 0.03) + ((subtotal - 6000000) * 0.02);
  return commission;
}

function AdminOrdersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const initialTab = searchParams.get('tab') || 'pending_admin_review'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [orders, setOrders] = useState<any[]>([])
  const [couriers, setCouriers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<any[] | null>(null)
  
  const [selectedCourierId, setSelectedCourierId] = useState<string>('')
  const [editedPrices, setEditedPrices] = useState<{ [key: string]: number }>({})

  // ✅ استیت‌های مربوط به تغییر پیک
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [newCourierId, setNewCourierId] = useState('')
  const [reassigning, setReassigning] = useState(false)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/admin/orders?tab=${tab}`)
  }

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    setLoading(true)

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`*, stores (name, phone_number, address), order_items (*), courier:profiles!courier_id (full_name, phone_number)`)
      .order('created_at', { ascending: false })

    if (ordersError) setMessage(`خطا در سفارشات: ${ordersError.message}`)
    else setOrders(ordersData || [])

    const { data: profilesData } = await supabase.from('profiles').select('*').eq('role', 'courier')
    const { data: activeOrders } = await supabase.from('orders').select('courier_id').eq('status', 'shipped')
    
    const busyCourierIds = activeOrders?.map(o => o.courier_id) || []
    const couriersWithStatus = (profilesData || []).map(c => ({
      ...c,
      isBusy: busyCourierIds.includes(c.id)
    }))
    setCouriers(couriersWithStatus)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const setItemStatus = (orderId: string, itemId: string, newStatus: 'available' | 'out_of_stock') => {
    if (!selectedGroup) return
    const updatedGroup = selectedGroup.map(o => {
      if (o.id === orderId) {
        const updatedItems = o.order_items.map((item: any) => item.id === itemId ? { ...item, item_status: newStatus } : item)
        return { ...o, order_items: updatedItems }
      }
      return o
    })
    setSelectedGroup(updatedGroup)
  }

  const calculateDynamicTotal = () => {
    if (!selectedGroup) return 0
    return selectedGroup.reduce((total, order) => {
      let availableItemsSum = 0
      order.order_items.forEach((item: any) => {
        if (item.item_status === 'available') {
          const finalPrice = editedPrices[item.id] !== undefined ? editedPrices[item.id] : item.unit_price;
          availableItemsSum += (finalPrice * item.quantity);
        }
      })
      return total + availableItemsSum + order.shipping_cost
    }, 0)
  }

  const handleApproveAndSend = async (group: any[]) => {
    if (!confirm('آیا از تایید موجودی و ارسال فاکتور برای پرداخت مطمئن هستید؟')) return
    try {
      for (const order of group) {
        let newSubtotal = 0
        for (const item of order.order_items) {
          if (item.item_status === 'available') {
            const finalUnitPrice = editedPrices[item.id] !== undefined ? editedPrices[item.id] : item.unit_price;
            const priceChanged = finalUnitPrice !== item.unit_price;
            const newTotalPrice = finalUnitPrice * item.quantity;
            
            newSubtotal += newTotalPrice;

            await supabase.from('order_items').update({ 
              unit_price: finalUnitPrice,
              total_price: newTotalPrice,
              price_changed: priceChanged,
              old_unit_price: priceChanged ? item.unit_price : item.old_unit_price
            }).eq('id', item.id)

            if (priceChanged) {
              await supabase.from('products').update({ price: finalUnitPrice, discount_price: null }).eq('id', item.product_id)
            }
          } else {
            await supabase.from('order_items').update({ item_status: 'out_of_stock' }).eq('id', item.id)
            await supabase.from('products').update({ stock: 0 }).eq('id', item.product_id)
          }
        }
        
        const newCommissionAmount = calculateCommission(newSubtotal);
        const newSellerNetAmount = newSubtotal - newCommissionAmount;
        const newTotal = newSubtotal + order.shipping_cost;
        const effectiveRate = newSubtotal > 0 ? (newCommissionAmount / newSubtotal) : 0;

        await supabase.from('orders').update({
          subtotal: newSubtotal, total_amount: newTotal, commission_rate: effectiveRate,
          commission_amount: newCommissionAmount, seller_net_amount: newSellerNetAmount,
          status: 'pending_payment'
        }).eq('id', order.id)
      }
      alert('فاکتور با موفقیت تایید شد. تغییرات قیمت و موجودی در غرفه نیز اعمال گردید.')
      setSelectedGroup(null)
      setEditedPrices({})
      fetchData()
    } catch (error: any) {
      alert(`خطا در تایید: ${error.message}`)
    }
  }

  const handleAssignCourier = async (group: any[]) => {
    if (!selectedCourierId) { alert('لطفاً ابتدا یک پیک انتخاب کنید.'); return }
    if (!confirm('آیا از تخصیص این فاکتور به پیک انتخاب شده مطمئن هستید؟')) return
    
    try {
      const orderIds = group.map((o: any) => o.id)
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'shipped',
          courier_id: selectedCourierId,
          assigned_at: new Date().toISOString()
        })
        .in('id', orderIds)

      if (error) throw error
      alert('فاکتور با موفقیت به پیک تخصیص داده شد.')
      setSelectedGroup(null)
      setSelectedCourierId('')
      fetchData()
    } catch (error: any) {
      alert(`خطا در ثبت ارسال: ${error.message}`)
    }
  }

  // ✅ تابع تغییر پیک
  const handleReassignCourier = async () => {
    if (!selectedGroup || !newCourierId) {
      alert('لطفاً پیک جدید را انتخاب کنید.')
      return
    }
    
    const currentCourierId = selectedGroup[0].courier_id
    if (newCourierId === currentCourierId) {
      alert('پیک انتخاب شده با پیک فعلی یکسان است.')
      return
    }

    if (!confirm('آیا از تغییر پیک این فاکتور مطمئن هستید؟ فاکتور از پنل پیک قبلی حذف و به پیک جدید منتقل می‌شود.')) return

    setReassigning(true)
    try {
      const orderIds = selectedGroup.map((o: any) => o.id)
      const { error } = await supabase
        .from('orders')
        .update({ 
          courier_id: newCourierId,
          assigned_at: new Date().toISOString()
        })
        .in('id', orderIds)

      if (error) throw error
      
      alert('پیک با موفقیت تغییر یافت. پیک قبلی آزاد شد.')
      setShowReassignModal(false)
      setNewCourierId('')
      setSelectedGroup(null)
      fetchData()
    } catch (error: any) {
      alert(`خطا در تغییر پیک: ${error.message}`)
    } finally {
      setReassigning(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری اطلاعات...</div>
  if (message) return <div className="p-8 text-center text-red-600 font-bold bg-red-50 rounded-2xl">{message}</div>

  const groupedOrders: any = {}
  orders.forEach(o => {
    const groupId = o.payment_group_id || o.id
    if (!groupedOrders[groupId]) groupedOrders[groupId] = []
    groupedOrders[groupId].push(o)
  })

  const getUniqueGroupCount = (status: string) => {
    const uniqueGroups = new Set()
    orders.forEach(o => {
      const gid = o.payment_group_id || o.id
      if (status === 'delivered') {
        if (o.status === 'shipped' || o.status === 'delivered') uniqueGroups.add(gid)
      } else if (o.status === status) {
        uniqueGroups.add(gid)
      }
    })
    return uniqueGroups.size
  }

  const filteredGroups = Object.values(groupedOrders).filter((group: any) => {
    if (activeTab === 'delivered') {
      return group.some((o: any) => o.status === 'shipped' || o.status === 'delivered')
    }
    return group.some((o: any) => o.status === activeTab)
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">مدیریت سفارشات</h1>
      
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        <button onClick={() => handleTabChange('pending_admin_review')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'pending_admin_review' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>
          در انتظار بررسی ({getUniqueGroupCount('pending_admin_review')})
        </button>
        <button onClick={() => handleTabChange('pending_payment')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'pending_payment' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
          در انتظار پرداخت ({getUniqueGroupCount('pending_payment')})
        </button>
        <button onClick={() => handleTabChange('paid')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'paid' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
          آماده ارسال ({getUniqueGroupCount('paid')})
        </button>
        <button onClick={() => handleTabChange('delivered')} className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'delivered' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}>
          ارسال / تحویل ({getUniqueGroupCount('delivered')})
        </button>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl shadow-sm border border-gray-100 text-gray-500 font-bold">هیچ سفارشی در این وضعیت وجود ندارد.</div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <tr>
                  <th className="p-4 font-bold">تاریخ</th>
                  <th className="p-4 font-bold">کد فاکتور</th>
                  <th className="p-4 font-bold">تعداد غرفه</th>
                  <th className="p-4 font-bold">وضعیت</th>
                  <th className="p-4 font-bold">مبلغ کل</th>
                  {activeTab === 'delivered' && <th className="p-4 font-bold">پیک</th>}
                  <th className="p-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredGroups.map((group: any) => {
                  const firstOrder = group[0]
                  const totalGroupAmount = group.reduce((sum: number, o: any) => sum + o.total_amount, 0)
                  const allDelivered = group.every((o: any) => o.status === 'delivered')
                  
                  let groupStatusLabel = null
                  if (activeTab === 'delivered') {
                    groupStatusLabel = allDelivered ? 'تحویل داده شده' : 'در حال ارسال'
                  } else if (activeTab === 'paid') {
                    groupStatusLabel = 'آماده تخصیص به پیک'
                  }

                  return (
                    <tr key={firstOrder.payment_group_id || firstOrder.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-sm text-gray-700">{new Date(firstOrder.created_at).toLocaleDateString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="p-4 font-mono text-xs text-gray-500">{(firstOrder.payment_group_id || firstOrder.id).split('-')[0].toUpperCase()}</td>
                      <td className="p-4 text-sm font-bold text-gray-600">{group.length} غرفه</td>
                      <td className="p-4">
                        {groupStatusLabel && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${allDelivered ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                            {groupStatusLabel}
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-gray-800">{totalGroupAmount.toLocaleString()} <span className="text-xs font-normal text-gray-400">تومان</span></td>
                      {activeTab === 'delivered' && (
                        <td className="p-4 text-xs font-bold text-gray-600">{firstOrder.courier?.full_name || 'نامشخص'}</td>
                      )}
                      <td className="p-4 text-center">
                        <button onClick={() => { setSelectedGroup(group); setSelectedCourierId(''); setEditedPrices({}); }} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors">
                          {activeTab === 'pending_admin_review' ? 'بررسی فاکتور' : 'مشاهده جزئیات'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-white p-5 border-b flex justify-between items-center z-10">
              <div>
                <h3 className="font-bold text-lg text-gray-800">جزئیات فاکتور</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-mono mt-1">
                  <span>کد: {(selectedGroup[0].payment_group_id || selectedGroup[0].id).split('-')[0].toUpperCase()}</span>
                </div>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4 bg-gray-50">
              {(activeTab === 'delivered' || selectedGroup[0].courier_id) && selectedGroup[0].courier && (
                <div className="bg-blue-50 text-blue-800 border border-blue-200 p-4 rounded-2xl text-sm mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        پیک تخصیص داده شده
                      </h4>
                      <p>نام پیک: <strong>{selectedGroup[0].courier?.full_name}</strong> | تلفن: <strong>{selectedGroup[0].courier?.phone_number}</strong></p>
                    </div>
                    {/* ✅ دکمه تغییر پیک - فقط اگر تحویل داده نشده باشد */}
                    {selectedGroup[0].status === 'shipped' && (
                      <button 
                        onClick={() => { setShowReassignModal(true); setNewCourierId(''); }}
                        className="bg-white text-blue-700 border border-blue-300 hover:bg-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        تغییر پیک
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(activeTab === 'paid' || activeTab === 'delivered') && (
                <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-4 rounded-2xl text-sm mb-4">
                  <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    اطلاعات ارسال و جمع‌آوری
                  </h4>
                  <p>مشتری: <strong>{selectedGroup[0].receiver_name}</strong> | تلفن: <strong>{selectedGroup[0].receiver_phone}</strong></p>
                  <p className="mt-1">آدرس مشتری: {selectedGroup[0].shipping_address}</p>
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <p className="font-bold text-indigo-700 mb-1">آدرس غرفه‌ها برای جمع‌آوری:</p>
                    {selectedGroup.map((o: any) => (
                      <p key={o.id}>- غرفه <strong>{o.stores?.name}</strong> (تلفن: {o.stores?.phone_number} | آدرس: {o.stores?.address})</p>
                    ))}
                  </div>
                </div>
              )}

              {selectedGroup.map((order: any) => (
                <div key={order.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  <div className="bg-indigo-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-indigo-800 text-sm">غرفه: {order.stores?.name}</span>
                  </div>
                  <div className="flex flex-col">
                    {order.order_items.map((item: any) => {
                      const isOutOfStock = item.item_status === 'out_of_stock'
                      return (
                        <div key={item.id} className={`grid grid-cols-[1fr_50px_120px_140px] items-center gap-2 p-3 border-b border-gray-50 last:border-0 ${isOutOfStock ? 'bg-red-50/30' : ''}`}>
                          <div className={`font-bold text-sm ${isOutOfStock ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.product_title}</div>
                          <div className="text-center text-xs bg-gray-100 text-gray-600 font-bold py-1 rounded">{item.quantity} عدد</div>
                          
                          {activeTab === 'pending_admin_review' && !isOutOfStock ? (
                            <div className="relative">
                              <input 
                                type="number" 
                                value={editedPrices[item.id] !== undefined ? editedPrices[item.id] : item.unit_price}
                                onChange={(e) => setEditedPrices({ ...editedPrices, [item.id]: Number(e.target.value) })}
                                className={`w-full text-left font-bold text-sm border rounded-lg px-2 py-1 outline-none transition-colors ${editedPrices[item.id] !== undefined && editedPrices[item.id] !== item.unit_price ? 'border-red-400 text-red-600 bg-red-50' : 'border-gray-200 text-gray-700'}`}
                                dir="ltr"
                              />
                            </div>
                          ) : (
                            <div className={`text-left font-bold text-sm ${isOutOfStock ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {item.unit_price.toLocaleString()}
                            </div>
                          )}
                          
                          {activeTab === 'pending_admin_review' ? (
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => setItemStatus(order.id, item.id, 'available')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${!isOutOfStock ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50'}`}>موجود</button>
                              <button onClick={() => setItemStatus(order.id, item.id, 'out_of_stock')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isOutOfStock ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50'}`}>ناموجود</button>
                            </div>
                          ) : (
                            <div className={`text-left text-xs font-bold flex flex-col items-end ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                              {isOutOfStock ? 'ناموجود' : 'موجود'}
                              {item.price_changed && <span className="text-[9px] text-orange-500 font-black mt-0.5 bg-orange-50 px-1 rounded">تغییر قیمت</span>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-white border-t flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
              <div className="text-lg font-black text-indigo-600 w-full sm:w-auto text-center sm:text-right">
                مبلغ کل: {calculateDynamicTotal().toLocaleString()} تومان
              </div>
              
              {activeTab === 'pending_admin_review' && (
                <button onClick={() => handleApproveAndSend(selectedGroup)} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 font-bold shadow-md transition-all text-sm">
                  تایید موجودی و ارسال برای پرداخت
                </button>
              )}

              {activeTab === 'paid' && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <select 
                    value={selectedCourierId} 
                    onChange={(e) => setSelectedCourierId(e.target.value)}
                    className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold"
                  >
                    <option value="">انتخاب پیک...</option>
                    {couriers.map(c => (
                      <option key={c.id} value={c.id} disabled={c.isBusy}>
                        {c.full_name} {c.isBusy ? '(مشغول)' : '(آزاد)'}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => handleAssignCourier(selectedGroup)} className="w-full sm:w-auto bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 font-bold shadow-md transition-all text-sm whitespace-nowrap">
                    ثبت ارسال
                  </button>
                </div>
              )}

              {activeTab === 'delivered' && (
                selectedGroup.every((o: any) => o.status === 'delivered') ? (
                  <span className="text-sm font-bold text-teal-600 bg-teal-50 px-4 py-2 rounded-xl">✓ این فاکتور تحویل داده شده است</span>
                ) : (
                  <span className="text-sm font-bold text-purple-600 bg-purple-50 px-4 py-2 rounded-xl">⏳ در انتظار تأیید دریافت توسط مشتری</span>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ مودال تغییر پیک */}
      {showReassignModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-indigo-600 p-5 text-white">
              <h3 className="font-bold text-lg mb-1">تغییر پیک فاکتور</h3>
              <p className="text-indigo-100 text-sm">فاکتور از پنل پیک قبلی حذف و به پیک جدید منتقل می‌شود.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm">
                <p className="text-xs text-gray-500 mb-1">پیک فعلی:</p>
                <p className="font-bold text-gray-800">{selectedGroup[0].courier?.full_name}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">پیک جدید را انتخاب کنید *</label>
                <select
                  value={newCourierId}
                  onChange={(e) => setNewCourierId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                >
                  <option value="">-- انتخاب پیک --</option>
                  {couriers.filter(c => !c.isBusy || c.id === selectedGroup[0].courier_id).map(c => (
                    <option key={c.id} value={c.id} disabled={c.id === selectedGroup[0].courier_id}>
                      {c.full_name} {c.id === selectedGroup[0].courier_id ? '(پیک فعلی)' : '(آزاد)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-2">فقط پیک‌های آزاد در این لیست نمایش داده می‌شوند.</p>
              </div>
            </div>

            <div className="p-5 bg-gray-50 border-t flex gap-2">
              <button 
                onClick={handleReassignCourier}
                disabled={reassigning || !newCourierId}
                className="flex-grow bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                {reassigning ? 'در حال تغییر...' : 'تایید و تغییر پیک'}
              </button>
              <button 
                onClick={() => { setShowReassignModal(false); setNewCourierId(''); }}
                className="px-6 bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>}>
      <AdminOrdersContent />
    </Suspense>
  )
}