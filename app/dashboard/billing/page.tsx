'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Calendar, ExternalLink, Settings, ArrowRight, Zap, Sparkles, Crown } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'

interface SubscriptionData {
    planId: string
    subscription: {
        id: string
        status: string
        currentPeriodEnd: string | null
        amount: number
        currency: string
        cancelAtPeriodEnd: boolean
    } | null
}

const planDetails: Record<string, { name: string; icon: any; color: string }> = {
    free: { name: 'Free Plan', icon: Zap, color: 'text-zinc-400' },
    pro: { name: 'Pro Plan', icon: Sparkles, color: 'text-red-500' },
    unlimited: { name: 'Unlimited Plan', icon: Crown, color: 'text-amber-500' },
}

export default function BillingPage() {
    const { user } = useAuth()
    const [data, setData] = useState<SubscriptionData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [portalLoading, setPortalLoading] = useState(false)

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user) return
            try {
                const response = await fetch('/api/user/subscription')
                const result = await response.json()
                if (response.ok) {
                    setData(result)
                }
            } catch (error) {
                console.error('Failed to fetch billing info:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSubscription()
    }, [user])

    const handleOpenPortal = async () => {
        setPortalLoading(true)
        try {
            const response = await fetch('/api/user/billing-portal', { method: 'POST' })
            const result = await response.json()
            if (response.ok && result.url) {
                window.location.href = result.url
            } else {
                alert(result.error || 'Failed to open billing portal')
            }
        } catch (error) {
            console.error('Portal error:', error)
            alert('Failed to connect to billing portal')
        } finally {
            setPortalLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex-1 bg-zinc-950 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
        )
    }

    const currentPlanInfo = planDetails[data?.planId || 'free']
    const nextPaymentDate = data?.subscription?.currentPeriodEnd 
        ? new Date(data.subscription.currentPeriodEnd).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : null

    return (
        <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                        <CreditCard size={20} className="text-zinc-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Current Plan Card */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Current Plan</p>
                                <h2 className={`text-3xl font-black ${currentPlanInfo.color} flex items-center gap-2`}>
                                    <currentPlanInfo.icon size={28} />
                                    {currentPlanInfo.name}
                                </h2>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                data?.subscription?.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                                {data?.subscription?.status || 'Active'}
                            </span>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-3 text-zinc-300">
                                <Calendar size={18} className="text-zinc-500" />
                                <div className="text-sm">
                                    <p className="text-zinc-500 text-xs">Next billing date</p>
                                    <p className="font-medium text-zinc-200">{nextPaymentDate || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 text-zinc-300">
                                <CreditCard size={18} className="text-zinc-500" />
                                <div className="text-sm">
                                    <p className="text-zinc-500 text-xs">Billing amount</p>
                                    <p className="font-medium text-zinc-200">
                                        {data?.subscription?.amount ? `${(data.subscription.amount / 100).toFixed(2)} ${data.subscription.currency.toUpperCase()}` : '$0.00'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={handleOpenPortal}
                                disabled={portalLoading}
                                className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                {portalLoading ? 'Loading...' : 'Manage Billing'}
                                <ExternalLink size={14} />
                            </button>
                            <Link 
                                href="/pricing"
                                className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold text-sm transition-all"
                            >
                                Change Plan
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Settings / FAQ */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Settings size={16} className="text-zinc-500" />
                                Billing Support
                            </h3>
                            <div className="space-y-4">
                                <div className="text-xs text-zinc-400">
                                    <p className="font-bold text-zinc-300 mb-1">Invoices</p>
                                    <p>You can view and download all your past invoices through the Polar Customer Portal.</p>
                                </div>
                                <div className="text-xs text-zinc-400">
                                    <p className="font-bold text-zinc-300 mb-1">Payment Methods</p>
                                    <p>Update your credit card or payment details securely at any time.</p>
                                </div>
                                <div className="text-xs text-zinc-400">
                                    <p className="font-bold text-zinc-300 mb-1">Cancellations</p>
                                    <p>Subscriptions can be canceled at any time through the portal. You will retain access until the end of the billing period.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
