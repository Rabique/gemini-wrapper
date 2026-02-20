'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { LogOut, User as UserIcon, LayoutDashboard, Settings, Video } from 'lucide-react'

export default function DashboardPage() {
    const { user, signOut, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 p-6 space-y-8 flex flex-col">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold">P</div>
                    <span className="text-xl font-bold tracking-tight">Polarutube</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <a href="#" className="flex items-center gap-3 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium">
                        <LayoutDashboard size={18} /> Dashboard
                    </a>
                    <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-colors">
                        <Video size={18} /> My Videos
                    </a>
                    <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-colors">
                        <Settings size={18} /> Settings
                    </a>
                </nav>

                <div className="pt-6 border-t border-zinc-800">
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-zinc-400 mt-1">Manage your channel and workspace</p>
                    </div>

                    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-2 pl-4 rounded-2xl">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold">{user?.email?.split('@')[0]}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Free Plan</span>
                        </div>
                        {user?.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Profile"
                                className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700">
                                <UserIcon size={20} className="text-zinc-500" />
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-2">Welcome to your workspace</h2>
                            <p className="text-zinc-400 max-w-md mb-6">
                                Start creating amazing content with Polarutube. Your professional toolkit is ready.
                            </p>
                            <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg active:scale-95">
                                Create New Project
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <Video size={120} />
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-2">
                            <UserIcon size={32} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Profile Info</h3>
                            <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
                        </div>
                        <button className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">
                            Edit Profile details
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
