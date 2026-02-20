'use client'

import { Check, Zap, Sparkles, Crown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        description: 'Perfect for trying out Polarutube.',
        features: ['10 AI chats / month', 'Basic support', 'Standard response speed'],
        icon: Zap,
        popular: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$9.99',
        description: 'For creators who need more power.',
        features: ['100 AI chats / month', 'Priority support', 'Fast response speed', 'Access to GPT-4 class models'],
        icon: Sparkles,
        popular: true,
    },
    {
        id: 'unlimited',
        name: 'Unlimited',
        price: '$29.99',
        description: 'Unleash your full potential.',
        features: ['Unlimited AI chats', '24/7 Priority support', 'Fastest response speed', 'Early access to new features'],
        icon: Crown,
        popular: false,
    },
]

export default function PricingPage() {
    const { user } = useAuth()
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [currentPlan, setCurrentPlan] = useState<string>('free')
    const router = useRouter()

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user) return
            try {
                const response = await fetch('/api/user/subscription')
                const data = await response.json()
                if (response.ok && data.planId) {
                    setCurrentPlan(data.planId)
                } else if (!response.ok) {
                    console.error('Subscription API Error:', data.error)
                    // alert(`Subscription API Error: ${data.error}`)
                }
            } catch (error: any) {
                console.error('Failed to fetch subscription:', error)
                // alert(`Network Error: ${error.message}`)
            }
        }

        fetchSubscription()
    }, [user])

    const handleUpgrade = async (planId: string) => {
        if (!user) {
            router.push('/login?next=/pricing')
            return
        }

        setLoadingId(planId)
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Checkout failed')
            }

            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('No checkout URL returned')
            }
        } catch (error: any) {
            console.error('Checkout error:', error)
            alert(`Checkout Error: ${error.message}`)
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 py-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        Choose the plan that best fits your creative needs. Upgrade or downgrade at any time.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-zinc-900/50 rounded-3xl p-8 border hover:border-zinc-700 transition-all duration-300 flex flex-col ${plan.popular ? 'border-red-600/50 shadow-[0_0_30px_rgba(220,38,38,0.1)] scale-105 z-10' : 'border-zinc-800'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            {plan.id === currentPlan && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-zinc-100 text-zinc-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xl flex items-center gap-1 border border-white">
                                    <Check size={12} strokeWidth={3} />
                                    Current Plan
                                </div>
                            )}

                            <div className="mb-8">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.popular ? 'bg-red-600/20 text-red-500' : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    <plan.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-zinc-400 text-sm h-10">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                <span className="text-zinc-500">/month</span>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                        <Check size={16} className={`mt-0.5 shrink-0 ${plan.popular ? 'text-red-500' : 'text-zinc-500'
                                            }`} />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => plan.id === currentPlan ? {} : handleUpgrade(plan.id)}
                                disabled={!!loadingId || plan.id === currentPlan}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.id === currentPlan
                                    ? 'bg-zinc-800 text-zinc-400 cursor-default'
                                    : plan.popular
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg hover:shadow-red-600/20'
                                        : 'bg-white hover:bg-zinc-200 text-black'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loadingId === plan.id ? 'Loading...' : (
                                    plan.id === currentPlan ? 'Current Plan' : 'Upgrade'
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
