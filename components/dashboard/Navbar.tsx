'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { User as UserIcon, Bell, Search, Zap, ArrowUpCircle, ChevronDown, Settings, LogOut, CreditCard } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useConversation } from '@/components/providers/ConversationProvider'

export const Navbar = () => {
    const { user, signOut } = useAuth()
    const { refreshTrigger } = useConversation()
    const [currentPlan, setCurrentPlan] = useState<string>('free')
    const [usage, setUsage] = useState<{ count: number, limit: number, plan: string } | null>(null)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchUsage = async () => {
            if (!user) return
            try {
                const response = await fetch('/api/user/usage', { cache: 'no-store' })
                const data = await response.json()
                if (response.ok) {
                    setUsage(data)
                    setCurrentPlan(data.plan)
                }
            } catch (error) {
                console.error('Failed to fetch usage:', error)
            }
        }

        fetchUsage()
    }, [user, refreshTrigger])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getPlanBadgeStyles = (plan: string) => {
        switch (plan) {
            case 'pro':
                return 'bg-red-600/20 text-red-400 border-red-500/30'
            case 'unlimited':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            default:
                return 'bg-zinc-800 text-zinc-400 border-zinc-700'
        }
    }

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
                {/* Upgrade Button - Visible if not unlimited */}
                {currentPlan !== 'unlimited' && (
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
                    <span className="text-xs font-bold text-zinc-300">
                        {usage ? (
                            usage.plan === 'unlimited' ? 'Unlimited' : `${usage.count} / ${usage.limit} Calls`
                        ) : 'Loading...'}
                    </span>
                </div>

                <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full ring-2 ring-zinc-950" />
                </button>

                <div className="h-8 w-[1px] bg-zinc-800 mx-2" />

                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 pl-2 group"
                    >
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors hidden sm:inline">
                                {user?.email?.split('@')[0]}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-bold uppercase tracking-wider ${getPlanBadgeStyles(currentPlan)}`}>
                                {currentPlan}
                            </span>
                        </div>
                        <div className="relative">
                            {user?.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-zinc-800 group-hover:ring-zinc-700 transition-all shadow-lg"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-zinc-700 transition-all">
                                    <UserIcon size={20} className="text-zinc-500" />
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5 border border-zinc-800">
                                <ChevronDown size={10} className={`text-zinc-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                            <div className="px-4 py-3 border-b border-zinc-800 mb-2">
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Signed in as</p>
                                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                            </div>

                            <div className="px-2 space-y-1">
                                <Link 
                                    href="/dashboard/billing"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                                >
                                    <CreditCard size={16} />
                                    Subscription & Billing
                                </Link>
                                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors">
                                    <Settings size={16} />
                                    Account Settings
                                </button>
                            </div>

                            <div className="px-2 mt-2 pt-2 border-t border-zinc-800">
                                <button 
                                    onClick={() => {
                                        setIsProfileOpen(false)
                                        signOut()
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                                >
                                    <LogOut size={16} />
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
