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

        const headers = Object.fromEntries(req.headers.entries())
        const event = (await validateEvent(body, headers, webhookSecret)) as any
        const supabase = createAdminClient()

        const type = event.type
        const data = event.data

        console.log(`[Polar Webhook] Type: ${type}, ID: ${data.id}`);

        // 유저 ID 추출 (모든 경로 시도)
        const userId = data.metadata?.userId || 
                       data.custom_field_data?.userId || 
                       data.metadata?.user_id ||
                       (data.checkout?.metadata?.userId) ||
                       (data.subscription?.metadata?.userId);

        // 플랜 판정
        const productId = data.product_id || data.productId;
        let plan = 'free';
        if (productId === process.env.POLAR_PRODUCT_ID_PRO) plan = 'pro';
        if (productId === process.env.POLAR_PRODUCT_ID_UNLIMITED) plan = 'unlimited';

        const subscriptionId = data.subscription_id || data.subscriptionId || (type.startsWith('subscription.') ? data.id : null);

        console.log(`[Polar Webhook] Processing: user=${userId}, plan=${plan}, sub=${subscriptionId}`);

        switch (type) {
            case 'checkout.created':
                return NextResponse.json({ received: true });

            case 'checkout.completed':
            case 'checkout.updated':
            case 'subscription.created':
            case 'subscription.active':
            case 'subscription.updated': {
                if (type === 'checkout.updated' && data.status !== 'confirmed') break;

                if (userId) {
                    const { error } = await supabase.from('subscriptions').upsert({
                        user_id: userId,
                        polar_subscription_id: subscriptionId,
                        plan: plan,
                        status: 'active',
                        current_period_end: data.current_period_end || data.currentPeriodEnd,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });
                    if (error) console.error('[Polar Webhook] DB Upsert Error:', error);
                } else if (subscriptionId) {
                    const { error } = await supabase.from('subscriptions').update({
                        plan: plan,
                        status: 'active',
                        current_period_end: data.current_period_end || data.currentPeriodEnd,
                        updated_at: new Date().toISOString()
                    }).eq('polar_subscription_id', subscriptionId);
                    if (error) console.error('[Polar Webhook] DB Update Error:', error);
                }
                break;
            }

            case 'subscription.canceled': {
                const subId = data.id || subscriptionId;
                await supabase.from('subscriptions').update({
                    status: 'canceled',
                    current_period_end: data.current_period_end || data.currentPeriodEnd,
                    updated_at: new Date().toISOString()
                }).eq('polar_subscription_id', subId);
                break;
            }

            case 'subscription.revoked': {
                const subId = data.id || subscriptionId;
                await supabase.from('subscriptions').update({
                    plan: 'free',
                    status: 'expired',
                    polar_subscription_id: null,
                    updated_at: new Date().toISOString()
                }).eq('polar_subscription_id', subId);
                break;
            }
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('[Polar Webhook] Error:', err.message)
        // Polar가 재전송을 계속하지 않도록 200 응답을 주되 에러 로깅
        return NextResponse.json({ error: err.message }, { status: 200 })
    }
}
