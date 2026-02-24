import { Polar } from '@polar-sh/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { planId } = await req.json()
        console.log('Checkout request for plan:', planId)
        
        const supabase = await createClient()

        // 1. 사용자 인증 확인
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !user.email) {
            console.error('User not authenticated')
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
        }

        // 2. 플랜별 Product ID 매핑 (환경변수 확인)
        let productId = ''
        if (planId === 'pro') {
            productId = process.env.POLAR_PRODUCT_ID_PRO || ''
        } else if (planId === 'unlimited') {
            productId = process.env.POLAR_PRODUCT_ID_UNLIMITED || ''
        }

        console.log('Mapped Product ID:', productId)

        if (!productId) {
            console.error(`Product ID not found for plan: ${planId}`)
            return NextResponse.json({ 
                error: '플랜 설정 오류', 
                details: `서버에 ${planId} 플랜의 Product ID가 설정되지 않았습니다. .env 파일을 확인해주세요.` 
            }, { status: 400 })
        }

        // 3. Polar SDK 초기화
        const accessToken = process.env.POLAR_ACCESS_TOKEN
        if (!accessToken) {
            console.error('Missing POLAR_ACCESS_TOKEN')
            return NextResponse.json({ error: '서버 설정 오류 (API Token 누락)' }, { status: 500 })
        }

        const polar = new Polar({
            accessToken: accessToken,
            server: process.env.POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
        })

        // 4. 절대 경로 URL 생성
        const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : new URL(req.url).origin
        console.log('Using origin for success URL:', origin)

        // 5. Checkout 생성
        const checkout = await polar.checkouts.create({
            products: [productId],
            successUrl: `${origin}/pricing/success?checkout_id={CHECKOUT_ID}`,
            customerEmail: user.email,
            metadata: {
                userId: user.id,
            },
        })

        console.log('Checkout session created! URL:', checkout.url)
        return NextResponse.json({ url: checkout.url })

    } catch (error: any) {
        console.error('Checkout API Error:', error)
        
        // Polar SDK 에러 상세 처리
        const status = error.statusCode || 500
        const message = error.message || '결제 세션 생성 중 오류가 발생했습니다.'
        const details = error.body ? JSON.stringify(error.body) : undefined

        return NextResponse.json({
            error: message,
            details: details
        }, { status })
    }
}
