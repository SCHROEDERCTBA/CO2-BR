import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/types';
import React from 'react';
import { AppLayoutClient } from '@/components/layout/app-layout-client';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      avatar_url,
      role,
      email,
      phone,
      is_active,
      last_login,
      created_at,
      updated_at
    `)
    .eq('id', user.id)
    .single<UserProfile>();

  // If the session is valid but the profile doesn't exist in the public.users table,
  // it means the user record is not fully set up.
  // Sign them out and redirect to login to prevent an infinite redirect loop.
  if (!profile) {
    await supabase.auth.signOut();
    return redirect('/login');
  }

  return (
    <AppLayoutClient profile={profile}>
        {children}
    </AppLayoutClient>
  );
}
