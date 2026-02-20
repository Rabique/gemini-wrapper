'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { User as UserIcon, Bell, Search, Zap, ArrowUpCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export const Navbar = () => {
    const { user } = useAuth()
    const [currentPlan, setCurrentPlan] = useState<string>('free')

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user) return
            try {
                const response = await fetch('/api/user/subscription')
                const data = await response.json()
                if (response.ok && data.planId) {
                    setCurrentPlan(data.planId)
                }
            } catch (error) {
                console.error('Failed to fetch subscription:', error)
            }
        }

        fetchSubscription()
    }, [user])

    return (
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600/50 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Upgrade Button for Free Users */}
                {currentPlan === 'free' && (
                    <Link
                        href="/pricing"
                        className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-red-600/20 group"
                    >
                        <ArrowUpCircle size={14} className="group-hover:rotate-12 transition-transform" />
                        Upgrade
                    </Link>
                )}

                {/* Credits display */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
                    <Zap size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-zinc-300">120 Credits</span>
                </div>

                <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full ring-2 ring-zinc-950" />
                </button>

                <div className="h-8 w-[1px] bg-zinc-800 mx-2" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-semibold text-white">{user?.email?.split('@')[0]}</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                            {currentPlan === 'free' ? 'Free Plan' : currentPlan === 'pro' ? 'Pro Plan' : 'Unlimited Plan'}
                        </span>
                    </div>
                    {user?.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-zinc-800"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
                            <UserIcon size={20} className="text-zinc-500" />
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
