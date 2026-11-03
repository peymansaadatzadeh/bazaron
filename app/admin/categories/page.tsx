'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'product' | 'store'>('product')
  const router = useRouter()

  // استیت‌های فرم (مودال)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
    if (profile?.role !== 'admin') { setMessage('شما دسترسی ندارید.'); setLoading(false); return }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', activeTab)
      .order('created_at', { ascending: true })

    if (error) setMessage(`خطا: ${error.message}`)
    else setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [activeTab])

  const handleOpenModal = (category: any = null, parent: string = '') => {
    setEditingCategory(category)
    setName(category ? category.name : '')
    setParentId(category ? category.parent_id || '' : parent)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const categoryData = {
      name,
      parent_id: parentId || null,
      type: activeTab
    }

    if (editingCategory) {
      // ویرایش
      const { error } = await supabase.from('categories').update(categoryData).eq('id', editingCategory.id)
      if (error) alert(error.message)
      else {
        setShowModal(false)
        fetchCategories()
      }
    } else {
      // ایجاد جدید
      const { error } = await supabase.from('categories').insert([categoryData])
      if (error) alert(error.message)
      else {
        setShowModal(false)
        fetchCategories()
      }
    }
    setIsSubmitting(false)
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('categories').update({ is_active: !currentStatus }).eq('id', id)
    if (error) alert(error.message)
    else fetchCategories()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این دسته‌بندی مطمئن هستید؟ (زیرمجموعه‌ها هم حذف می‌شوند)')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) alert(error.message)
    else fetchCategories()
  }

  // تابع برای نمایش درختی (چندلایه)
  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = categories.filter(c => c.parent_id === parentId)
    
    if (children.length === 0) return null

    return (
      <div className={`space-y-2 ${depth > 0 ? 'mr-6 border-r-2 border-gray-100 pr-4 mt-2' : ''}`}>
        {children.map(cat => (
          <div key={cat.id} className="flex flex-col">
            <div className={`flex justify-between items-center p-3 rounded-xl border ${cat.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-800 text-sm">{cat.name}</span>
                {!cat.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded">غیرفعال</span>}
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => handleOpenModal(null, cat.id)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200" title="افزودن زیرمجموعه">+ زیرشاخه</button>
                <button onClick={() => handleOpenModal(cat)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">ویرایش</button>
                <button onClick={() => toggleActive(cat.id, cat.is_active)} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded hover:bg-orange-100">
                  {cat.is_active ? 'غیرفعال' : 'فعال'}
                </button>
                <button onClick={() => handleDelete(cat.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">حذف</button>
              </div>
            </div>
            
            {/* رندر کردن زیرمجموعه‌ها */}
            {renderTree(cat.id, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div></div>
  if (message) return <div className="p-8 text-center text-red-600 font-bold bg-red-50 m-8 rounded-2xl">{message}</div>

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800">مدیریت دسته‌بندی‌ها</h1>
          <Link href="/admin" className="text-indigo-600 hover:underline font-bold">بازگشت به پنل ادمین</Link>
        </div>

        {/* تب‌ها */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
          <button 
            onClick={() => { setActiveTab('product'); setCategories([]); setLoading(true); }} 
            className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'product' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
          >
            دسته‌بندی محصولات
          </button>
          <button 
            onClick={() => { setActiveTab('store'); setCategories([]); setLoading(true); }} 
            className={`px-5 py-2.5 rounded-t-xl font-bold transition-colors ${activeTab === 'store' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
          >
            دسته‌بندی غرفه‌ها
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="font-bold text-gray-800">ساختار درختی دسته‌بندی‌ها</h2>
            <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
              + افزودن دسته اصلی
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-10 text-gray-500">هیچ دسته‌بندی ساخته نشده است.</div>
          ) : (
            renderTree(null)
          )}
        </div>
      </div>

      {/* مودال ساخت/ویرایش */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">نام دسته‌بندی *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-50 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">دسته والد (اختیاری)</label>
                <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full bg-gray-50 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">-- بدون والد (دسته اصلی) --</option>
                  {categories
                    .filter(c => !editingCategory || c.id !== editingCategory.id) // جلوگیری از انتخاب خودش به عنوان والد
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">اگر می‌خواهید این دسته زیرمجموعه یک دسته دیگر باشد، آن را انتخاب کنید.</p>
              </div>

              <div className="pt-4 flex gap-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-gray-400">
                  {isSubmitting ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}