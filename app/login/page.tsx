'use client'

import { createClient } from '@/lib/supabase/client'
import { Chrome } from 'lucide-react'

export default function LoginPage() {
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                        <span className="text-white text-3xl font-bold">P</span>
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
                        <p className="text-zinc-400">Sign in to Polarutube to continue</p>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-zinc-200 transition-all duration-200 active:scale-[0.98]"
                    >
                        <Chrome size={20} />
                        Continue with Google
                    </button>

                    <p className="text-xs text-zinc-500 text-center px-6">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    )
}
