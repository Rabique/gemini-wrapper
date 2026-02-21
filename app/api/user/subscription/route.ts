import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Polar } from '@polar-sh/sdk'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
            console.log('User not authenticated or missing email, returning free plan')
            return NextResponse.json({ planId: 'free' })
        }

        const polar = new Polar({
            accessToken: process.env.POLAR_ACCESS_TOKEN!,
            server: process.env.POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
        })

        let planId = 'free'
        let subscription: any = null

        console.log('Fetching subscriptions for user email:', user.email)
        
        // 1. Find Customer by Email
        const customers = await polar.customers.list({
            email: user.email,
        })

        // Check if customers.result exists and has items
        const customerItems = customers.result?.items || []
        const customer = customerItems[0]

        if (customer) {
            console.log('Found Polar customer:', customer.id)
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
                console.log('Active/Trialing subscription found:', activeSub.id, 'Status:', activeSub.status, 'Product ID:', activeSub.productId)
                subscription = activeSub
                const productId = activeSub.productId

                if (productId === process.env.POLAR_PRODUCT_ID_PRO) planId = 'pro'
                if (productId === process.env.POLAR_PRODUCT_ID_UNLIMITED) planId = 'unlimited'
            } else {
                console.log('No active or trialing subscriptions found for customer.')
            }
        } else {
            console.log('No Polar customer found for email:', user.email)
        }

        return NextResponse.json({ 
            planId,
            subscription: subscription ? {
                id: subscription.id,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                amount: subscription.amount,
                currency: subscription.currency,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
            } : null
        })

    } catch (error: any) {
        console.error('Error fetching subscription:', error)
        // If it's a Polar SDK error, it might have more details
        if (error.body) {
            console.error('Polar Error Details:', error.body)
        }
        // Return free plan on error to avoid blocking the UI
        return NextResponse.json({ planId: 'free' })
    }
}
