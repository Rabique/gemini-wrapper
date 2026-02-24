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
        const event = await validateEvent(body, headers, webhookSecret)
        const supabase = createAdminClient()

        const type = event.type
        const data = event.data as any

        console.log(`[Polar Webhook] Received: ${type}`, { id: data.id });

        // 1. 유저 ID 추출 (모든 가능한 경로 탐색)
        const userId = data.metadata?.userId || 
                       data.custom_field_data?.userId || 
                       data.metadata?.user_id ||
                       (data.checkout?.metadata?.userId) ||
                       (data.subscription?.metadata?.userId);

        if (!userId && type.startsWith('checkout.')) {
            console.error('[Polar Webhook] No userId found in webhook data');
            return NextResponse.json({ error: 'No userId found' }, { status: 200 }); // Polar에 성공 응답은 주되 기록은 패스
        }

        // 2. 플랜 판정 함수 (환경 변수와 직접 대조)
        const getPlan = (pid: string) => {
            if (pid === process.env.POLAR_PRODUCT_ID_PRO) return 'pro';
            if (pid === process.env.POLAR_PRODUCT_ID_UNLIMITED) return 'unlimited';
            return 'free';
        };

        const productId = data.product_id || data.productId;
        const subscriptionId = data.subscription_id || data.subscriptionId || data.id;

        switch (type) {
            case 'checkout.completed':
            case 'checkout.updated':
            case 'subscription.created':
            case 'subscription.active':
            case 'subscription.updated': {
                // 결제 성공 또는 구독 활성화 시점
                if (type === 'checkout.updated' && data.status !== 'confirmed') break;

                const plan = getPlan(productId);
                if (plan === 'free') {
                    console.warn(`[Polar Webhook] Unknown Product ID: ${productId}. Defaulting to free or skipping.`);
                }

                console.log(`[Polar Webhook] Syncing Plan: user=${userId}, plan=${plan}, sub=${subscriptionId}`);

                // UPSERT 실행
                const { error } = await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    polar_subscription_id: subscriptionId,
                    plan: plan,
                    status: 'active',
                    current_period_end: data.current_period_end || data.currentPeriodEnd,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

                if (error) console.error('[Polar Webhook] DB Upsert Error:', error);
                else console.log('[Polar Webhook] DB Sync Success');
                break;
            }

            case 'subscription.canceled': {
                console.log(`[Polar Webhook] Subscription Canceled: ${subscriptionId}`);
                await supabase.from('subscriptions').update({
                    status: 'canceled',
                    current_period_end: data.current_period_end || data.currentPeriodEnd,
                    updated_at: new Date().toISOString()
                }).eq('polar_subscription_id', subscriptionId);
                break;
            }

            case 'subscription.revoked': {
                console.log(`[Polar Webhook] Subscription Revoked: ${subscriptionId}`);
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
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 })
    }
}
