import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const error_description = searchParams.get('error_description')
    const error_name = searchParams.get('error')

    console.log('Auth Callback Triggered:', { origin, code: !!code, error_name, error_description })

    // if "next" is in search params, use it as the redirection URL after successful sign in
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('Auth Code Exchange Successful')
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            console.error('Auth Code Exchange Error:', error)
        }
    } else {
        console.warn('No Auth Code provided in callback')
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
