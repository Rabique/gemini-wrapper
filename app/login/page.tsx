'use client'

import { createClient } from '@/lib/supabase/client'
import { Chrome, Loader2, Mail, Lock, UserPlus, LogIn } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const supabase = createClient()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.push('/dashboard')
            }
        }
        checkUser()
    }, [supabase, router])

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (err: any) {
            console.error('Login error:', err)
            setError(err.message || 'Failed to login with Google')
            setIsLoading(false)
        }
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                
                if (data.session) {
                    router.push('/dashboard')
                } else {
                    setSuccess('Check your email for the confirmation link!')
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.push('/dashboard')
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                        <span className="text-white text-2xl font-bold">P</span>
                    </div>
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Polarutube
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            {isSignUp ? 'Create your account' : 'Welcome back'}
                        </p>
                    </div>
                </div>

                {/* Mode Toggle Tabs */}
                <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                    <button
                        onClick={() => { setIsSignUp(false); setError(null); setSuccess(null); }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isSignUp ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setIsSignUp(true); setError(null); setSuccess(null); }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isSignUp ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                    >
                        {isLoading && !email ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Chrome size={18} />
                        )}
                        Continue with Google
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-zinc-800"></div>
                        <span className="flex-shrink mx-4 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Or email</span>
                        <div className="flex-grow border-t border-zinc-800"></div>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600/50 transition-all text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600/50 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                        >
                            {isLoading && email ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : isSignUp ? (
                                <UserPlus size={18} />
                            ) : (
                                <LogIn size={18} />
                            )}
                            {isSignUp ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-[10px] text-zinc-600 text-center uppercase tracking-widest font-bold pt-2">
                    © 2026 Polarutube. All rights reserved.
                </p>
            </div>
        </div>
    )
}
