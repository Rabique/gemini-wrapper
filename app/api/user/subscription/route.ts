import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ planId: 'free' })
        }

        // Fetch subscription from DB
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!sub) {
            return NextResponse.json({ planId: 'free' })
        }

        return NextResponse.json({ 
            planId: sub.plan,
            subscription: {
                id: sub.polar_subscription_id,
                status: sub.status,
                currentPeriodEnd: sub.current_period_end,
                // amount & currency are no longer fetched directly from DB in this version
                // but can be added if needed via checkout events
            }
        })

    } catch (error: any) {
        console.error('Error fetching subscription:', error)
        return NextResponse.json({ planId: 'free' })
    }
}
