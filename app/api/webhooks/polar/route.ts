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
        console.log('Configured Product IDs:', {
            pro: process.env.POLAR_PRODUCT_ID_PRO,
            unlimited: process.env.POLAR_PRODUCT_ID_UNLIMITED
        })

        // Cast to any to handle various event types across SDK versions
        const type = event.type as any
        const data = event.data as any

        // Helper to determine plan from productId
        const getPlanFromProductId = (pid: string) => {
            if (pid === process.env.POLAR_PRODUCT_ID_PRO) return 'pro'
            if (pid === process.env.POLAR_PRODUCT_ID_UNLIMITED) return 'unlimited'
            return 'free'
        }

        switch (type) {
            case 'checkout.completed':
            case 'checkout.updated': {
                const checkout = data
                if (type === 'checkout.updated' && checkout.status !== 'confirmed' && checkout.status !== 'succeeded') {
                    break
                }
                
                const userId = checkout.metadata?.userId || checkout.custom_field_data?.userId
                const subscriptionId = checkout.subscriptionId
                const productId = checkout.productId
                
                if (!userId) {
                    console.error('No userId found in checkout metadata/custom_fields:', checkout.id)
                    break
                }

                const plan = getPlanFromProductId(productId)
                console.log(`Updating via checkout: user=${userId}, plan=${plan}, subId=${subscriptionId}`)

                const { error } = await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    polar_subscription_id: subscriptionId,
                    plan: plan,
                    status: 'active',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' })
                
                if (error) console.error('Database Error (checkout):', error)
                break
            }

            case 'subscription.created':
            case 'subscription.active':
            case 'subscription.updated': {
                const sub = data
                const userId = sub.metadata?.userId || sub.custom_field_data?.userId
                const productId = sub.productId
                const plan = getPlanFromProductId(productId)

                console.log(`Processing subscription event: ${type}`, {
                    subId: sub.id,
                    userId,
                    plan
                })

                if (!userId) {
                    // If no userId in metadata, try to find by polar_subscription_id
                    const { error } = await supabase.from('subscriptions').update({
                        plan: plan,
                        status: 'active',
                        current_period_end: sub.currentPeriodEnd,
                        updated_at: new Date().toISOString()
                    }).eq('polar_subscription_id', sub.id)
                    
                    if (error) console.error('Database Error (sub update by ID):', error)
                } else {
                    // Primary method: update by userId
                    const { error } = await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        polar_subscription_id: sub.id,
                        plan: plan,
                        status: 'active',
                        current_period_end: sub.currentPeriodEnd,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' })
                    
                    if (error) console.error('Database Error (sub upsert by user):', error)
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
