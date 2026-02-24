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
        const subscriptionId = data.subscription_id || data.subscriptionId || (type.startsWith('subscription.') ? data.id : null);

        switch (type) {
            case 'checkout.completed':
            case 'checkout.updated':
            case 'subscription.created':
            case 'subscription.active':
            case 'subscription.updated': {
                if (type === 'checkout.updated' && data.status !== 'confirmed') break;

                const plan = getPlan(productId);
                
                console.log(`[Polar Webhook] Syncing: type=${type}, user=${userId}, plan=${plan}, sub=${subscriptionId}`);

                if (userId) {
                    // 유저 ID가 있으면 확실하게 UPSERT
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
                    // 유저 ID가 없으면 구독 ID로 기존 레코드 업데이트
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
                console.log(`[Polar Webhook] Subscription Canceled: ${subId}`);
                await supabase.from('subscriptions').update({
                    status: 'canceled',
                    current_period_end: data.current_period_end || data.currentPeriodEnd,
                    updated_at: new Date().toISOString()
                }).eq('polar_subscription_id', subId);
                break;
            }

            case 'subscription.revoked': {
                const subId = data.id || subscriptionId;
                console.log(`[Polar Webhook] Subscription Revoked: ${subId}`);
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
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 })
    }
}
