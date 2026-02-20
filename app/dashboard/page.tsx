'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/dashboard/Navbar'
import { ChatArea } from '@/components/dashboard/ChatArea'
import { useAuth } from '@/components/providers/AuthProvider'

export default function DashboardPage() {
    const { loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.3)]"></div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-zinc-950 text-zinc-200 overflow-hidden font-sans selection:bg-red-600/30">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Container */}
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />

                {/* Chat / Content Area */}
                <main className="flex-1 overflow-hidden">
                    <ChatArea />
                </main>
            </div>
        </div>
    )
}
