import { Polar } from '@polar-sh/sdk'
import { validateEvent } from '@polar-sh/sdk/webhooks'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = req.headers.get('webhook-signature') || ''

    if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 })
    }

    try {
        const webhookSecret = process.env.POLAR_WEBHOOK_SECRET
        if (!webhookSecret) {
            throw new Error('POLAR_WEBHOOK_SECRET is not configured')
        }

        const event = validateEvent(body, signature, webhookSecret)
        const supabase = await createClient()

        console.log('Polar Webhook Event received:', event.type)

        switch (event.type) {
            case 'checkout.completed': {
                const checkout = event.data
                const userId = checkout.metadata?.userId as string
                const subscriptionId = checkout.subscriptionId
                const productId = checkout.productId
                
                let plan = 'free'
                if (productId === process.env.POLAR_PRODUCT_ID_PRO) plan = 'pro'
                if (productId === process.env.POLAR_PRODUCT_ID_UNLIMITED) plan = 'unlimited'

                await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    polar_subscription_id: subscriptionId,
                    plan: plan,
                    status: 'active',
                    current_period_end: null // Will be updated by subscription.active/updated
                })
                break
            }

            case 'subscription.active':
            case 'subscription.updated': {
                const sub = event.data
                const productId = sub.productId
                let plan = 'free'
                if (productId === process.env.POLAR_PRODUCT_ID_PRO) plan = 'pro'
                if (productId === process.env.POLAR_PRODUCT_ID_UNLIMITED) plan = 'unlimited'

                await supabase.from('subscriptions').update({
                    plan: plan,
                    status: 'active',
                    current_period_end: sub.currentPeriodEnd,
                }).eq('polar_subscription_id', sub.id)
                break
            }

            case 'subscription.canceled': {
                const sub = event.data
                // canceled = 기간 끝까지 유지 후 만료 예정
                await supabase.from('subscriptions').update({
                    status: 'canceled',
                    current_period_end: sub.currentPeriodEnd
                }).eq('polar_subscription_id', sub.id)
                break
            }

            case 'subscription.revoked': {
                const sub = event.data
                // revoked = 즉시 해지 (Free 전환)
                await supabase.from('subscriptions').update({
                    plan: 'free',
                    status: 'revoked',
                    polar_subscription_id: null
                }).eq('polar_subscription_id', sub.id)
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('Webhook Error:', err.message)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 })
    }
}
