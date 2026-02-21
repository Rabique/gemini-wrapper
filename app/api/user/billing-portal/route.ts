import { Polar } from '@polar-sh/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: process.env.POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
        })

        // 1. Find Customer by Email
        const customers = await polar.customers.list({
            email: user.email,
        })

        const customer = customers.result?.items?.[0]

        if (!customer) {
            return NextResponse.json({ error: 'No Polar customer found. Please subscribe first.' }, { status: 404 })
        }

        // 2. Create Customer Session for the Portal
        const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
        
        const session = await polar.customerSessions.create({
            customerId: customer.id,
            returnUrl: `${origin}/dashboard/billing`,
        })

        return NextResponse.json({ url: session.customerPortalUrl })

    } catch (error: any) {
        console.error('Billing Portal Error:', error)
        return NextResponse.json({ 
            error: 'Failed to create billing portal session',
            details: error.body || error.message
        }, { status: 500 })
    }
}
