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

        console.log(`[Polar Webhook] Raw Data for ${type}:`, JSON.stringify({
            id: data.id,
            productId: data.productId || data.product_id,
            metadata: data.metadata,
            custom_field_data: data.custom_field_data
        }));

        // Helper to determine plan from productId
        const getPlanFromProductId = (pid: string) => {
            const proId = process.env.POLAR_PRODUCT_ID_PRO;
            const unlimitedId = process.env.POLAR_PRODUCT_ID_UNLIMITED;
            
            console.log(`[Polar Webhook] Comparing received ID "${pid}" with env IDs: PRO="${proId}", UNLIMITED="${unlimitedId}"`);
            
            if (pid === proId) return 'pro';
            if (pid === unlimitedId) return 'unlimited';
            return null; // Return null if no match found
        };

        const userId = data.metadata?.userId || 
                       data.custom_field_data?.userId || 
                       data.metadata?.user_id ||
                       (data.checkout?.metadata?.userId);

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
                    console.error('[Polar Webhook] No userId found in checkout event:', checkout.id);
                    break;
                }

                const plan = getPlanFromProductId(productId);
                if (!plan) {
                    console.error(`[Polar Webhook] Could not determine plan for Product ID: ${productId}`);
                    break;
                }

                console.log(`[Polar Webhook] Updating via checkout: user=${userId}, plan=${plan}, subId=${subscriptionId}`);

                const { error } = await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    polar_subscription_id: subscriptionId,
                    plan: plan,
                    status: 'active',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
                
                if (error) console.error('[Polar Webhook] Database Error (checkout):', error);
                break;
            }

            case 'subscription.created':
            case 'subscription.active':
            case 'subscription.updated': {
                const sub = data;
                const productId = sub.productId || sub.product_id;
                const plan = getPlanFromProductId(productId);
                const subId = sub.id;

                if (!plan) {
                    console.error(`[Polar Webhook] Could not determine plan for Subscription Product ID: ${productId}`);
                    break;
                }

                if (userId) {
                    console.log(`[Polar Webhook] Upserting subscription by userId: ${userId}, plan: ${plan}`);
                    const { error } = await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        polar_subscription_id: subId,
                        plan: plan,
                        status: 'active',
                        current_period_end: sub.currentPeriodEnd || sub.current_period_end,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                    if (error) console.error('[Polar Webhook] Database Error (sub upsert):', error);
                } else {
                    console.log(`[Polar Webhook] Updating subscription by polar_subscription_id: ${subId}, plan: ${plan}`);
                    const { error } = await supabase.from('subscriptions').update({
                        plan: plan,
                        status: 'active',
                        current_period_end: sub.currentPeriodEnd || sub.current_period_end,
                        updated_at: new Date().toISOString()
                    }).eq('polar_subscription_id', subId);
                    if (error) console.error('[Polar Webhook] Database Error (sub update):', error);
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
