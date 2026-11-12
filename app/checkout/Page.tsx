'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// ایمپورت داینامیک برای جلوگیری از خطای SSR کتابخانه نقشه (Leaflet)
const CheckoutForm = dynamic(() => import('./CheckoutForm'), {
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