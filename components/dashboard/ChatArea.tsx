'use client'

import { Send, Sparkles, Paperclip, Mic } from 'lucide-react'
import { useState } from 'react'

export const ChatArea = () => {
    const [input, setInput] = useState('')

    const mockMessages = [
        { role: 'assistant', content: 'Hello! I am your AI video assistant. How can I help you with your YouTube channel today?' },
        { role: 'user', content: 'Can you help me brainstorm some titles for a video about AI coding assistants?' },
        { role: 'assistant', content: 'Certainly! Here are some compelling titles for your AI coding assistant video:\n\n1. "The Future of Coding: AI is Changing Everything"\n2. "I Built an Entire App with Just AI (Honest Review)"\n3. "AI vs Developer: Who Codes Better in 2026?"\n4. "Top 5 AI Tools That Will Save You 10+ Hours a Week"\n\nWhich of these styles do you prefer?' },
    ]

    return (
        <div className="flex-1 flex flex-col h-full relative">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full">
                {mockMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold ${msg.role === 'assistant' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                            {msg.role === 'assistant' ? 'A' : 'U'}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'assistant' ? 'bg-zinc-900/50 border border-zinc-800 text-zinc-200' : 'bg-white text-black font-medium'
                            }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-6 pb-10">
                <div className="max-w-4xl mx-auto w-full relative">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-2 shadow-2xl focus-within:border-red-600/50 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
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
                                    Premium Mode
                                </div>
                                <button className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95">
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
