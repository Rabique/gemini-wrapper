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
        if (!webhookSecret) throw new Error('POLAR_WEBHOOK_SECRET is not configured')

        // Supabase 관리자 키 확인
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Polar Webhook] SUPABASE_SERVICE_ROLE_KEY is missing in environment variables');
            return NextResponse.json({ error: 'Server configuration error: missing supabase key' }, { status: 200 });
        }

        const headers = Object.fromEntries(req.headers.entries())
        const event = (await validateEvent(body, headers, webhookSecret)) as any
        const supabase = createAdminClient()

        const type = event.type
        const data = event.data

        console.log(`[Polar Webhook] Received: ${type}`);

        // 유저 ID 추출 함수
        const getUserId = (obj: any): string | null => {
            return obj.metadata?.userId || 
                   obj.custom_field_data?.userId || 
                   obj.metadata?.user_id ||
                   obj.checkout?.metadata?.userId ||
                   obj.subscription?.metadata?.userId ||
                   (obj.active_subscriptions && obj.active_subscriptions[0]?.metadata?.userId);
        }

        const userId = getUserId(data);

        // 플랜 판정 함수
        const getPlan = (pid: string) => {
            if (pid === process.env.POLAR_PRODUCT_ID_PRO) return 'pro';
            if (pid === process.env.POLAR_PRODUCT_ID_UNLIMITED) return 'unlimited';
            return 'free';
        };

        const productId = data.product_id || data.productId || (data.active_subscriptions && data.active_subscriptions[0]?.product_id);
        const subscriptionId = data.subscription_id || data.subscriptionId || data.id || (data.active_subscriptions && data.active_subscriptions[0]?.id);

        switch (type) {
            case 'customer.state_changed':
            case 'checkout.completed':
            case 'checkout.updated':
            case 'subscription.created':
            case 'subscription.active':
            case 'subscription.updated': {
                if (type === 'checkout.updated' && data.status !== 'confirmed') break;

                const plan = getPlan(productId);
                const subId = subscriptionId;
                const finalUserId = userId || (data.active_subscriptions && getUserId(data.active_subscriptions[0]));

                console.log(`[Polar Webhook] Syncing Plan: user=${finalUserId}, plan=${plan}, sub=${subId}`);

                if (finalUserId) {
                    await supabase.from('subscriptions').upsert({
                        user_id: finalUserId,
                        polar_subscription_id: subId,
                        plan: plan,
                        status: 'active',
                        current_period_end: data.current_period_end || data.currentPeriodEnd || (data.active_subscriptions && data.active_subscriptions[0]?.current_period_end),
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                } else if (subId) {
                    await supabase.from('subscriptions').update({
                        plan: plan,
                        status: 'active',
                        updated_at: new Date().toISOString()
                    }).eq('polar_subscription_id', subId);
                }
                break;
            }

            case 'subscription.canceled': {
                await supabase.from('subscriptions').update({
                    status: 'canceled',
                    updated_at: new Date().toISOString()
                }).eq('polar_subscription_id', subscriptionId);
                break;
            }

            case 'subscription.revoked': {
                await supabase.from('subscriptions').update({
                    plan: 'free',
                    status: 'expired',
                    polar_subscription_id: null,
                    updated_at: new Date().toISOString()
                }).eq('polar_subscription_id', subscriptionId);
                break;
            }
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('[Polar Webhook] Error:', err.message)
        return NextResponse.json({ error: err.message }, { status: 200 })
    }
}
