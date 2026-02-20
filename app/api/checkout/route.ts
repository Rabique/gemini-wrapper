import { Polar } from '@polar-sh/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { planId } = await req.json()
        console.log('Checkout request for plan:', planId)
        const supabase = await createClient()

        // Map planId to environment variable Product IDs
        let productId = ''
        if (planId === 'pro') productId = process.env.POLAR_PRODUCT_ID_PRO!
        if (planId === 'unlimited') productId = process.env.POLAR_PRODUCT_ID_UNLIMITED!

        console.log('Mapped to Product ID:', productId)

        if (!productId) {
            console.error('Invalid plan ID:', planId)
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.error('User not authenticated')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const accessToken = process.env.POLAR_ACCESS_TOKEN
        if (!accessToken) {
            console.error('Missing POLAR_ACCESS_TOKEN')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: process.env.POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
        })

        console.log('Creating checkout session...')
        const checkout = await polar.checkouts.create({
            products: [productId],
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing/success?checkout_id={CHECKOUT_ID}`,
            customerEmail: user.email,
            metadata: {
                userId: user.id,
            },
        })

        return NextResponse.json({ url: checkout.url })
    } catch (error: any) {
        console.error('Checkout Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to create checkout session',
            details: error.response ? await error.response.text() : undefined
        }, { status: 500 })
    }
}
