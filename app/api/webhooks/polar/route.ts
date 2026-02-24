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

        const type = event.type as any
        const data = event.data as any

        console.log(`[Polar Webhook] ${type} received. ID: ${data.id}`);

        // Helper to determine plan from productId
        const getPlanFromProductId = (pid: string) => {
            const proId = process.env.POLAR_PRODUCT_ID_PRO;
            const unlimitedId = process.env.POLAR_PRODUCT_ID_UNLIMITED;
            
            if (pid === proId) return 'pro';
            if (pid === unlimitedId) return 'unlimited';
            return null;
        };

        // Comprehensive userId search
        const userId = data.metadata?.userId || 
                       data.custom_field_data?.userId || 
                       data.metadata?.user_id ||
                       data.checkout?.metadata?.userId ||
                       data.subscription?.metadata?.userId;

        switch (type) {
            case 'checkout.completed':
            case 'checkout.updated': {
                const checkout = data;
                if (type === 'checkout.updated' && checkout.status !== 'confirmed' && checkout.status !== 'succeeded') {
                    break;
                }
                
                const subscriptionId = checkout.subscriptionId || checkout.subscription_id;
                const productId = checkout.productId || checkout.product_id;
                
                if (!userId) {
                    console.error('[Polar Webhook] No userId found in checkout metadata');
                    break;
                }

                const plan = getPlanFromProductId(productId);
                if (!plan) break;

                console.log(`[Polar Webhook] Syncing checkout for user: ${userId}, plan: ${plan}`);

                await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    polar_subscription_id: subscriptionId,
                    plan: plan,
                    status: 'active',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
                break;
            }

            case 'subscription.created':
            case 'subscription.active':
            case 'subscription.updated': {
                const sub = data;
                const productId = sub.productId || sub.product_id;
                const plan = getPlanFromProductId(productId);
                
                if (!plan) break;

                // Try update by userId first, then by subscriptionId
                if (userId) {
                    console.log(`[Polar Webhook] Syncing subscription for user: ${userId}, plan: ${plan}`);
                    await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        polar_subscription_id: sub.id,
                        plan: plan,
                        status: 'active',
                        current_period_end: sub.currentPeriodEnd || sub.current_period_end,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                } else {
                    console.log(`[Polar Webhook] Syncing by subId: ${sub.id}, plan: ${plan}`);
                    await supabase.from('subscriptions').update({
                        plan: plan,
                        status: 'active',
                        current_period_end: sub.currentPeriodEnd || sub.current_period_end,
                        updated_at: new Date().toISOString()
                    }).eq('polar_subscription_id', sub.id);
                }
                break;
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
