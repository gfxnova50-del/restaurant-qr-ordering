import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import { NextRequest } from 'next/server';

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers
 * using cookies for session management.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase public environment variables');
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if middleware is refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          // The `remove` method was called from a Server Component.
        }
      },
    },
  });
}

/**
 * Creates a Supabase client from a NextRequest, supporting both Bearer JWT tokens
 * and cookies for API Route authentication.
 */
export function createClientFromRequest(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase public environment variables');
  }

  const authHeader = request.headers.get('Authorization');

  // If a Bearer token is provided directly in header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    });
  }

  // Fallback to request cookies
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Route handlers can return Set-Cookie headers if needed
      },
      remove(name: string, options: CookieOptions) {},
    },
  });
}
