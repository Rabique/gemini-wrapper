import { Polar } from '@polar-sh/sdk'
import { validateEvent } from '@polar-sh/sdk/webhooks'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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

        const headers = Object.fromEntries(req.headers.entries())
        const event = await validateEvent(body, headers, webhookSecret)
        const supabase = createAdminClient()

        console.log('Polar Webhook Event received:', event.type)

        // Cast to any to handle various event types across SDK versions
        const type = event.type as any
        const data = event.data as any

        switch (type) {
            case 'checkout.completed':
            case 'checkout.updated': {
                const checkout = data
                // For checkout.updated, we only want to process it if it's confirmed
                if (type === 'checkout.updated' && checkout.status !== 'confirmed') {
                    break
                }
                
                const userId = checkout.metadata?.userId as string
                const subscriptionId = checkout.subscriptionId
                const productId = checkout.productId
                
                console.log('Processing checkout:', { type, userId, subscriptionId, productId })
                
                if (!userId) {
                    console.error('No userId in checkout metadata')
                    break
                }

                let plan = 'free'
                if (productId === process.env.POLAR_PRODUCT_ID_PRO) plan = 'pro'
                if (productId === process.env.POLAR_PRODUCT_ID_UNLIMITED) plan = 'unlimited'

                const { error } = await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    polar_subscription_id: subscriptionId,
                    plan: plan,
                    status: 'active',
                    current_period_end: null 
                })
                
                if (error) {
                    console.error('Error upserting subscription:', error)
                } else {
                    console.log('Subscription updated successfully for user:', userId, 'to plan:', plan)
                }
                break
            }

            case 'subscription.active':
            case 'subscription.created':
            case 'subscription.updated': {
                const sub = data
                const productId = sub.productId
                let plan = 'free'
                if (productId === process.env.POLAR_PRODUCT_ID_PRO) plan = 'pro'
                if (productId === process.env.POLAR_PRODUCT_ID_UNLIMITED) plan = 'unlimited'

                console.log('Updating subscription:', { subId: sub.id, productId, plan })

                const { error } = await supabase.from('subscriptions').update({
                    plan: plan,
                    status: 'active',
                    current_period_end: sub.currentPeriodEnd,
                }).eq('polar_subscription_id', sub.id)
                
                if (error) {
                    console.error('Error updating subscription:', error)
                }
                break
            }

            case 'subscription.canceled': {
                const sub = data
                console.log('Canceling subscription:', sub.id)
                await supabase.from('subscriptions').update({
                    status: 'canceled',
                    current_period_end: sub.currentPeriodEnd
                }).eq('polar_subscription_id', sub.id)
                break
            }

            case 'subscription.revoked': {
                const sub = data
                console.log('Revoking subscription:', sub.id)
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
