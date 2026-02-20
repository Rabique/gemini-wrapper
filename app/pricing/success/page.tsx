'use client'

import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
    const searchParams = useSearchParams()
    const checkoutId = searchParams.get('checkout_id')

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>

            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-500 w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-zinc-400 mb-8">
                Thank you for upgrading your plan. Your new limits are now active.
            </p>

            <Link
                href="/dashboard"
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-zinc-200 transition-colors"
            >
                Go to Dashboard
                <ArrowRight size={18} />
            </Link>

            <p className="text-zinc-600 text-xs mt-8 text-center">
                Checkout ID: {checkoutId}
            </p>
        </div>
    )
}

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    )
}
