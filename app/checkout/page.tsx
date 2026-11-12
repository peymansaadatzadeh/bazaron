'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// ✅ آپدیت شد به حروف کوچک
const CheckoutForm = dynamic(() => import('./checkoutForm'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
    </div>
  )
})

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}