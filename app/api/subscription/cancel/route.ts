import { Polar } from '@polar-sh/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Get Subscription ID from DB
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('polar_subscription_id')
            .eq('user_id', user.id)
            .single()

        if (!sub?.polar_subscription_id) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
        }

        // 2. Polar SDK Initialization
        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: process.env.POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
        })

        // 3. Cancel via Polar (at the end of the period)
        await polar.subscriptions.update({
            id: sub.polar_subscription_id,
            subscriptionUpdate: {
                cancelAtPeriodEnd: true,
            },
        })

        // Webhook (subscription.canceled) will handle updating the DB status to 'canceled'

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Cancel Subscription Error:', error)
        return NextResponse.json({ 
            error: 'Failed to cancel subscription',
            details: error.message 
        }, { status: 500 })
    }
}
