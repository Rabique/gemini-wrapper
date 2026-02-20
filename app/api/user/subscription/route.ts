import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Polar } from '@polar-sh/sdk'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            return NextResponse.json({ planId: 'free' })
        }

        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: process.env.POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
        })

        let planId = 'free'

        // 1. Find Customer by Email
        // Note: The SDK's list method returns an asynchronous iterator or a paginated response.
        // We need to handle it correctly. Based on documentation, list returns a Result object which contains items.

        const customers = await polar.customers.list({
            email: user.email,
        })

        // Check if customers.result exists and has items
        const customerItems = customers.result?.items || []
        const customer = customerItems[0]

        if (customer) {
            // 2. List Subscriptions for this Customer
            const subscriptions = await polar.subscriptions.list({
                customerId: customer.id,
                active: true,
            })

            const subItems = subscriptions.result?.items || []
            console.log(`Found ${subItems.length} subscriptions for customer ${customer.id}`)

            // Find the most relevant active or trialing subscription
            const activeSub = subItems.find(sub => sub.status === 'active' || sub.status === 'trialing')

            if (activeSub) {
                console.log('Active/Trialing subscription found:', activeSub.id, 'Status:', activeSub.status)
                // The product ID is available directly in the subscription object
                const productId = activeSub.productId

                if (productId === process.env.POLAR_PRODUCT_ID_PRO) planId = 'pro'
                if (productId === process.env.POLAR_PRODUCT_ID_UNLIMITED) planId = 'unlimited'
            } else {
                console.log('No active or trialing subscriptions found.')
            }
        }

        return NextResponse.json({ planId })

    } catch (error) {
        console.error('Error fetching subscription:', error)
        // Return free plan on error to avoid blocking the UI
        return NextResponse.json({ planId: 'free' })
    }
}
