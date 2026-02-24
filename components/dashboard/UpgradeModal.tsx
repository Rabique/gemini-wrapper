'use client'

import { X, Zap, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface UpgradeModalProps {
    isOpen: boolean
    onClose: () => void
    limit: number
}

export const UpgradeModal = ({ isOpen, onClose, limit }: UpgradeModalProps) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="relative p-8">
                    <button 
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                            <Zap size={32} className="text-white fill-white" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Monthly Limit Reached</h2>
                            <p className="text-zinc-400">
                                You&apos;ve used all {limit} conversations for this month. 
                                Upgrade to Pro to keep the conversation going!
                            </p>
                        </div>

                        <div className="w-full grid grid-cols-1 gap-4 py-4">
                            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Check size={20} className="text-emerald-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Up to 100 Conversations</p>
                                    <p className="text-xs text-zinc-500">More than enough for most creators</p>
                                </div>
                            </div>
                            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Check size={20} className="text-amber-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Advanced AI Models</p>
                                    <p className="text-xs text-zinc-500">Unlock more powerful insights</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex flex-col gap-3">
                            <Link 
                                href="/pricing"
                                onClick={onClose}
                                className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98]"
                            >
                                View Plans <ArrowRight size={18} />
                            </Link>
                            <button 
                                onClick={onClose}
                                className="w-full py-4 text-zinc-500 hover:text-zinc-300 text-sm font-semibold transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
