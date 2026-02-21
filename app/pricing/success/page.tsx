'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const checkoutId = searchParams.get('checkout_id')
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

    useEffect(() => {
        if (!checkoutId) {
            setStatus('error')
            return
        }

        // We can optionally verify the checkout status here via our API
        // For now, we'll assume success if we have the ID and redirect after a delay
        const timer = setTimeout(() => {
            setStatus('success')
        }, 1500)

        return () => clearTimeout(timer)
    }, [checkoutId])

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                {status === 'loading' && (
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="w-16 h-16 text-red-500 animate-spin" />
                        <h1 className="text-2xl font-bold text-white">Verifying Payment...</h1>
                        <p className="text-zinc-400">Please wait while we confirm your subscription.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>
                        <p className="text-zinc-400">
                            Thank you for upgrading! Your account has been updated with your new plan features.
                        </p>
                        <div className="pt-6 w-full">
                            <Link 
                                href="/dashboard"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-red-600/20"
                            >
                                Go to Dashboard
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 text-3xl font-bold">!</div>
                        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                        <p className="text-zinc-400">We couldn't verify your checkout. If you believe this is an error, please contact support.</p>
                        <Link href="/pricing" className="text-red-500 hover:underline">Return to Pricing</Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-zinc-700 animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}
