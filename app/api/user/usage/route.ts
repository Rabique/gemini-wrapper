import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const currentMonth = new Date().toISOString().slice(0, 7) // 2025-02 형식

        // Get subscription for limits
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', user.id)
            .single()

        const plan = subscription?.plan || 'free'
        const limits: Record<string, number> = { free: 10, pro: 100, unlimited: Infinity }

        // Get usage
        const { data: usage } = await supabase
            .from('usage')
            .select('count')
            .eq('user_id', user.id)
            .eq('month', currentMonth)
            .single()

        return NextResponse.json({
            plan,
            count: usage?.count || 0,
            limit: limits[plan],
            month: currentMonth
        })

    } catch (error) {
        console.error('Usage API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
    }
}
