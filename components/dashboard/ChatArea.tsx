import { createClient } from '@/lib/supabase/client'
import { Send, Sparkles, Paperclip, Mic, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useConversation } from '@/components/providers/ConversationProvider'
import { UpgradeModal } from './UpgradeModal'

interface ChatAreaProps {
    conversationId: string | null
    onConversationCreated: (id: string) => void
}

export const ChatArea = ({ conversationId, onConversationCreated }: ChatAreaProps) => {
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
    const [limit, setLimit] = useState(10)
    const supabase = createClient()
    const { refreshConversations } = useConversation()

    useEffect(() => {
        if (conversationId) {
            fetchMessages(conversationId)
        } else {
            setMessages([{ role: 'assistant', content: 'Hello! I am your AI video assistant. How can I help you with your YouTube channel today?' }])
        }
    }, [conversationId])

    const fetchMessages = async (id: string) => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setMessages(data)
        }
        setIsLoading(false)
    }

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage = { role: 'user', content: input }
        setInput('')
        setIsLoading(true)

        // Add both messages at once to keep index stable
        setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }])

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    conversationId: conversationId
                }),
            })

            if (response.status === 429) {
                const data = await response.json()
                setLimit(data.limit)
                setIsUpgradeModalOpen(true)
                setMessages(prev => {
                    const updated = [...prev]
                    if (updated.length > 0) {
                        updated[updated.length - 1] = {
                            role: 'assistant',
                            content: `You've reached your monthly limit of ${data.limit} conversations. Please upgrade your plan to continue.`,
                            isLimitError: true
                        }
                    }
                    return updated
                })
                setIsLoading(false)
                return
            }

            if (!response.ok) throw new Error('Failed to fetch response')

            const newConvId = response.headers.get('x-conversation-id')
            if (newConvId && !conversationId) {
                onConversationCreated(newConvId)
                refreshConversations()
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let assistantContent = ''

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    assistantContent += chunk

                    setMessages(prev => {
                        const updated = [...prev]
                        if (updated.length > 0) {
                            updated[updated.length - 1] = {
                                role: 'assistant',
                                content: assistantContent
                            }
                        }
                        return updated
                    })
                }
            }
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => {
                const updated = [...prev]
                if (updated.length > 0) {
                    updated[updated.length - 1] = {
                        role: 'assistant',
                        content: 'Sorry, I encountered an error processing your request.'
                    }
                }
                return updated
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex-1 flex flex-col h-full relative">
            <UpgradeModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)} 
                limit={limit}
            />
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full">
                {messages.map((msg, i) => {
                    if (!msg || !msg.role) return null;
                    return (
                        <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold ${msg.role === 'assistant' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                {msg.role === 'assistant' ? 'A' : 'U'}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl p-4 flex flex-col gap-4 ${msg.role === 'assistant' ? 'bg-zinc-900/50 border border-zinc-800 text-zinc-200' : 'bg-white text-black font-medium'
                                }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                
                                {msg.isLimitError && (
                                    <Link 
                                        href="/pricing"
                                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all w-fit shadow-lg shadow-red-600/20"
                                    >
                                        Upgrade Plan Now <ArrowRight size={14} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isLoading && messages[messages.length - 1]?.content === '' && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold animate-pulse">A</div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 pb-10">
                <div className="max-w-4xl mx-auto w-full relative">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-2 shadow-2xl focus-within:border-red-600/50 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                            placeholder="Ask anything about your videos..."
                            className="w-full bg-transparent border-none focus:ring-0 text-zinc-200 p-4 min-h-[60px] max-h-[200px] resize-none text-sm"
                            rows={1}
                        />
                        <div className="flex items-center justify-between px-2 pb-2">
                            <div className="flex items-center gap-1">
                                <button className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
                                    <Paperclip size={18} />
                                </button>
                                <button className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors">
                                    <Mic size={18} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-zinc-800 rounded-xl text-zinc-400 text-xs font-bold mr-2">
                                    <Sparkles size={12} className="text-amber-400" />
                                    Gemini 3.1 Pro
                                </div>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !input.trim()}
                                    className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 text-center mt-3 uppercase tracking-tighter font-bold opacity-50">
                        Powered by Polarutube Intelligence • Responses may be inaccurate
                    </p>
                </div>
            </div>
        </div>
    )
}
