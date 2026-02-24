'use client'

import { ChatArea } from '@/components/dashboard/ChatArea'
import { useConversation } from '@/components/providers/ConversationProvider'

export default function DashboardPage() {
    const { activeConversationId, setActiveConversationId } = useConversation()

    return (
        <ChatArea
            conversationId={activeConversationId}
            onConversationCreated={(id) => setActiveConversationId(id)}
        />
    )
}
