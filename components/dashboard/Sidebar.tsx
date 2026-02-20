'use client'

import { Plus, MessageSquare, Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatHistoryItem {
    id: string
    title: string
    date: string
}

const mockHistory: ChatHistoryItem[] = [
    { id: '1', title: 'YouTube Algorithm Analysis', date: 'Today' },
    { id: '2', title: 'Video Script Helper', date: 'Yesterday' },
    { id: '3', title: 'SEO Keyword Research', date: 'Feb 18' },
]

export const Sidebar = () => {
    return (
        <aside className="w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full overflow-hidden">
            {/* New Chat Button */}
            <div className="p-4">
                <button className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-black font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98]">
                    <Plus size={18} />
                    New Conversation
                </button>
            </div>

            {/* History Section */}
            <div className="flex-1 overflow-y-auto px-2 space-y-6">
                <div>
                    <h3 className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Recent History</h3>
                    <div className="space-y-1">
                        {mockHistory.map((item) => (
                            <div
                                key={item.id}
                                className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900 cursor-pointer transition-colors relative"
                            >
                                <MessageSquare size={16} className="text-zinc-500 group-hover:text-zinc-300" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm text-zinc-300 truncate font-medium">{item.title}</p>
                                    <p className="text-[10px] text-zinc-600 uppercase font-bold">{item.date}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1 hover:text-red-400 text-zinc-600 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom section */}
            <div className="p-4 border-t border-zinc-900">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-xs font-bold">P</div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-semibold text-zinc-300">Polarutube Pro</p>
                        <p className="text-[10px] text-zinc-500">Upgrade for more</p>
                    </div>
                    <button className="text-zinc-500 hover:text-white">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>
        </aside>
    )
}
