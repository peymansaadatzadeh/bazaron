'use client'

import dynamic from 'next/dynamic'

// ✅ این خط به Next.js می‌گوید: این فایل را در سرور رندر نکن!
const CheckoutForm = dynamic(() => import('./CheckoutForm'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
    </div>
  )
})

export default function CheckoutPage() {
  return <CheckoutForm />
}
