import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected Routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    (request.nextUrl.pathname.startsWith('/buyer') || 
     request.nextUrl.pathname.startsWith('/seller'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Role Access Control
  if (user) {
    const role = user.user_metadata.role || 'buyer' // Default to buyer
    
    // Prevent Seller accessing Buyer routes (optional, but good for separation)
    // Actually, usually sellers can be buyers too, but sticking to strict separation for now:
    if (role === 'seller' && request.nextUrl.pathname.startsWith('/buyer')) {
        const url = request.nextUrl.clone()
        url.pathname = '/seller/dashboard'
        return NextResponse.redirect(url)
    }

    // Prevent Buyer accessing Seller routes
    if (role === 'buyer' && request.nextUrl.pathname.startsWith('/seller')) {
        const url = request.nextUrl.clone()
        url.pathname = '/buyer/dashboard'
        return NextResponse.redirect(url)
    }
    
    // Redirect root to dashboard if logged in
     if (request.nextUrl.pathname === '/') {
        const url = request.nextUrl.clone()
        url.pathname = `/${role}/dashboard`
        return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/trpc (trpc api)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/trpc|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
