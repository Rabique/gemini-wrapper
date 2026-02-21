'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/dashboard/Navbar'
import { useAuth } from '@/components/providers/AuthProvider'
import { useState } from 'react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { loading } = useAuth()
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.3)]"></div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-200 overflow-hidden font-sans selection:bg-red-600/30">
            <Sidebar
                activeConversationId={activeConversationId || undefined}
                onSelectConversation={(id) => setActiveConversationId(id)}
                onNewChat={() => setActiveConversationId(null)}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />
                <main className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
