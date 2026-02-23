import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { messages, conversationId } = await req.json()
        const apiKey = process.env.GOOGLE_API_KEY
        const supabase = await createClient()

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // --- Usage Tracking Start ---
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan, status')
            .eq('user_id', user.id)
            .single()

        const plan = subscription?.plan || 'free'
        const limits: Record<string, number> = { free: 10, pro: 100, unlimited: Infinity }
        const currentMonth = new Date().toISOString().slice(0, 7) // 2025-02 형식

        let usageCount = 0
        if (plan !== 'unlimited') {
            const { data: usage } = await supabase
                .from('usage')
                .select('count')
                .eq('user_id', user.id)
                .eq('month', currentMonth)
                .single()
            
            usageCount = usage?.count || 0

            if (usageCount >= limits[plan]) {
                const upgradeUrl = `${new URL(req.url).origin}/pricing`
                return NextResponse.json({ 
                    error: 'Usage limit reached', 
                    upgradeUrl,
                    limit: limits[plan],
                    count: usageCount
                }, { status: 429 })
            }
        }
        // --- Usage Tracking End ---

        if (!apiKey) {
            return NextResponse.json({ error: 'Google API Key is not configured' }, { status: 500 })
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

        // 2. Resolve Conversation
        let currentConvId = conversationId
        let isNewConversation = !currentConvId

        if (isNewConversation) {
            // Create a new conversation with a default title from the first message
            const initialTitle = messages[messages.length - 1].content.slice(0, 40) || 'New Conversation'
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .insert({ user_id: user.id, title: initialTitle })
                .select()
                .single()

            if (convError) throw convError
            currentConvId = conv.id
        }

        // 3. Save User Message
        const lastUserMessage = messages[messages.length - 1].content
        const { error: msgSaveError } = await supabase
            .from('messages')
            .insert({
                conversation_id: currentConvId,
                role: 'user',
                content: lastUserMessage
            })

        if (msgSaveError) throw msgSaveError

        // 4. Prepare Gemini History
        const chatHistory = messages
            .slice(0, -1)
            .map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content || '' }],
            }))
            .filter((m: any, i: number, arr: any[]) => {
                const firstUserIndex = arr.findIndex(msg => msg.role === 'user')
                if (firstUserIndex === -1) return false
                return i >= firstUserIndex
            })

        const chat = model.startChat({ history: chatHistory })

        // 5. Streaming Response
        const stream = new ReadableStream({
            async start(controller) {
                let fullAiResponse = ''
                try {
                    const result = await chat.sendMessageStream(lastUserMessage)
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text()
                        fullAiResponse += chunkText
                        controller.enqueue(new TextEncoder().encode(chunkText))
                    }

                    // Save AI response to DB after stream completes
                    await supabase.from('messages').insert({
                        conversation_id: currentConvId,
                        role: 'assistant',
                        content: fullAiResponse
                    })

                    // Increment usage if not unlimited
                    if (plan !== 'unlimited') {
                        const { data: usage } = await supabase
                            .from('usage')
                            .select('count')
                            .eq('user_id', user.id)
                            .eq('month', currentMonth)
                            .single()
                        
                        const nextCount = (usage?.count || 0) + 1

                        await supabase
                            .from('usage')
                            .upsert({ user_id: user.id, month: currentMonth, count: nextCount }, { onConflict: 'user_id,month' })
                    }

                    controller.close()
                } catch (error) {
                    console.error('Gemini Stream Error:', error)
                    controller.error(error)
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'x-conversation-id': currentConvId,
            },
        })
    } catch (error) {
        console.error('Chat API Error:', error)
        return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 })
    }
}
