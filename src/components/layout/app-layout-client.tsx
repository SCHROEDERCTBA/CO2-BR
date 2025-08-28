'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { UserNav } from '@/components/layout/user-nav';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import type { UserProfile } from '@/lib/types';
import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export function AppLayoutClient({
  profile,
  children,
}: {
  profile: UserProfile;
  children: React.ReactNode;
}) {
  return (
      <SidebarProvider>
        <AppSidebar role={profile.role} />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex-1" />
            <UserNav user={profile} />
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
  );
}
