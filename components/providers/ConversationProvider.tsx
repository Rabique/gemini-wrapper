'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type ConversationContextType = {
    activeConversationId: string | null
    setActiveConversationId: (id: string | null) => void
    refreshTrigger: number
    refreshConversations: () => void
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function ConversationProvider({ children }: { children: ReactNode }) {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const refreshConversations = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <ConversationContext.Provider value={{ 
            activeConversationId, 
            setActiveConversationId, 
            refreshTrigger, 
            refreshConversations 
        }}>
            {children}
        </ConversationContext.Provider>
    )
}

export const useConversation = () => {
    const context = useContext(ConversationContext)
    if (context === undefined) {
        throw new Error('useConversation must be used within a ConversationProvider')
    }
    return context
}
