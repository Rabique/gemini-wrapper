'use client'

import { ChatArea } from '@/components/dashboard/ChatArea'
import { useState } from 'react'

export default function DashboardPage() {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

    return (
        <ChatArea
            conversationId={activeConversationId}
            onConversationCreated={(id) => setActiveConversationId(id)}
        />
    )
}
