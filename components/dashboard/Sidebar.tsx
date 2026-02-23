import { Plus, MessageSquare, Trash2, MoreVertical, LogOut, CreditCard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'

interface Conversation {
    id: string
    title: string
    created_at: string
}

interface SidebarProps {
    onSelectConversation: (id: string) => void
    activeConversationId?: string
    onNewChat: () => void
}

export const Sidebar = ({ onSelectConversation, activeConversationId, onNewChat }: SidebarProps) => {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [usage, setUsage] = useState<{ count: number, limit: number, plan: string } | null>(null)
    const supabase = createClient()
    const { signOut } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        fetchConversations()
        fetchUsage()
    }, [])

    const fetchUsage = async () => {
        try {
            const response = await fetch('/api/user/usage')
            const data = await response.json()
            if (response.ok) {
                setUsage(data)
            }
        } catch (error) {
            console.error('Failed to fetch usage:', error)
        }
    }

    const fetchConversations = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setConversations(data)
        }
        setIsLoading(false)
    }

    const deleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', id)

        if (!error) {
            setConversations(prev => prev.filter(c => c.id !== id))
            if (activeConversationId === id) {
                onNewChat()
            }
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days} days ago`
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }

    return (
        <aside className="w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full overflow-hidden">
            {/* New Chat Button */}
            <div className="p-4 space-y-2">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-black font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
                >
                    <Plus size={18} />
                    New Conversation
                </button>
            </div>

            {/* History Section */}
            <div className="flex-1 overflow-y-auto px-2 space-y-6">
                <div>
                    <h3 className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Recent History</h3>
                    <div className="space-y-1">
                        {isLoading ? (
                            <div className="px-4 py-3 text-zinc-600 animate-pulse text-sm">Loading history...</div>
                        ) : conversations.length === 0 ? (
                            <div className="px-4 py-3 text-zinc-600 text-sm italic">No history yet</div>
                        ) : (
                            conversations.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        if (pathname !== '/dashboard') {
                                            router.push('/dashboard')
                                        }
                                        onSelectConversation(item.id)
                                    }}
                                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors relative ${activeConversationId === item.id && pathname === '/dashboard' ? 'bg-zinc-900 border border-zinc-800' : 'hover:bg-zinc-900'
                                        }`}
                                >
                                    <MessageSquare size={16} className={`${activeConversationId === item.id && pathname === '/dashboard' ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                                        }`} />
                                    <div className="flex-1 overflow-hidden">
                                        <p className={`text-sm truncate font-medium ${activeConversationId === item.id && pathname === '/dashboard' ? 'text-white' : 'text-zinc-300'
                                            }`}>{item.title}</p>
                                        <p className="text-[10px] text-zinc-600 uppercase font-bold">{formatDate(item.created_at)}</p>
                                    </div>
                                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                        <button
                                            onClick={(e) => deleteConversation(item.id, e)}
                                            className="p-1 hover:text-red-400 text-zinc-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom section */}
            <div className="p-4 border-t border-zinc-900 space-y-4">
                {/* Usage Progress Bar */}
                {usage && (
                    <div className="px-2 space-y-2">
                        <div className="flex justify-between items-end mb-1">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                Monthly Usage
                            </p>
                            <p className="text-[10px] font-bold text-zinc-400">
                                {usage.plan === 'unlimited' ? '∞' : `${usage.count}/${usage.limit}`}
                            </p>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                            <div 
                                className={`h-full transition-all duration-500 rounded-full ${
                                    usage.plan === 'unlimited' ? 'bg-amber-500' : 
                                    (usage.count / usage.limit) >= 0.8 ? 'bg-red-500' : 'bg-zinc-100'
                                }`}
                                style={{ width: `${usage.plan === 'unlimited' ? 100 : Math.min((usage.count / usage.limit) * 100, 100)}%` }}
                            />
                        </div>
                        
                        {(usage.plan !== 'unlimited' && (usage.count / usage.limit) >= 0.8) && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 animate-pulse">
                                <p className="text-[10px] text-red-400 font-bold text-center leading-tight">
                                    {(usage.count / usage.limit) >= 1 
                                        ? "Limit reached! Upgrade to continue."
                                        : "Approaching monthly limit!"}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={() => router.push('/dashboard/billing')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${pathname === '/dashboard/billing'
                        ? 'bg-zinc-900 border-zinc-800 text-white shadow-xl shadow-white/5'
                        : 'bg-zinc-950 border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                        }`}
                >
                    <CreditCard size={18} />
                    <span className="text-sm font-semibold">Billing Settings</span>
                </button>

                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-all border border-transparent hover:border-red-900/30"
                >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">Log Out</span>
                </button>

                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-red-600/20">P</div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-semibold text-zinc-300">Polarutube Pro</p>
                        <p className="text-[10px] text-zinc-500">Upgrade for more</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
