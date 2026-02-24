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
                console.log(`Processing checkout event: ${type}`, {
                    id: checkout.id,
                    status: checkout.status,
                    userId: checkout.metadata?.userId,
                    productId: checkout.productId,
                    subscriptionId: checkout.subscriptionId
                })

                // For checkout.updated, we only want to process it if it's confirmed or succeeded
                if (type === 'checkout.updated' && checkout.status !== 'confirmed' && checkout.status !== 'succeeded') {
                    console.log('Skipping checkout.updated because status is:', checkout.status)
                    break
                }
                
                const userId = checkout.metadata?.userId as string
                const subscriptionId = checkout.subscriptionId
                const productId = checkout.productId
                
                if (!userId) {
                    console.error('No userId found in checkout metadata. Make sure to pass metadata during checkout creation.')
                    break
                }

                let plan = 'free'
                if (productId === process.env.POLAR_PRODUCT_ID_PRO) plan = 'pro'
                else if (productId === process.env.POLAR_PRODUCT_ID_UNLIMITED) plan = 'unlimited'
                else {
                    console.warn('Unknown Product ID received in webhook:', productId, '. Expected PRO or UNLIMITED IDs from env.')
                }

                console.log(`Upserting subscription for user ${userId}. Plan: ${plan}, SubID: ${subscriptionId}`)

                const { error } = await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    polar_subscription_id: subscriptionId,
                    plan: plan,
                    status: 'active',
                    current_period_end: null 
                }, { onConflict: 'user_id' })
                
                if (error) {
                    console.error('Database Error upserting subscription:', error)
                } else {
                    console.log('Subscription table updated successfully.')
                }
                break
            }

            case 'subscription.active':
            case 'subscription.created':
            case 'subscription.updated': {
                const sub = data
                const productId = sub.productId
                const userId = sub.metadata?.userId
                
                let plan = 'free'
                if (productId === process.env.POLAR_PRODUCT_ID_PRO) plan = 'pro'
                if (productId === process.env.POLAR_PRODUCT_ID_UNLIMITED) plan = 'unlimited'

                console.log('Updating subscription event:', type, { subId: sub.id, userId, productId, plan })

                let query = supabase.from('subscriptions').update({
                    plan: plan,
                    status: 'active',
                    current_period_end: sub.currentPeriodEnd,
                    polar_subscription_id: sub.id
                })

                if (userId) {
                    query = query.eq('user_id', userId)
                } else {
                    query = query.eq('polar_subscription_id', sub.id)
                }

                const { error } = await query
                
                if (error) {
                    console.error('Error updating subscription:', error)
                } else {
                    console.log('Subscription update successful for:', userId || sub.id)
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
