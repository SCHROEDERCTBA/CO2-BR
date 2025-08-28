'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login Error:', error);
    return { error: 'Credenciais inválidas. Verifique seu email e senha.' };
  }

  redirect('/dashboard');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function signup(prevState: any, formData: FormData) {
  const fullName = formData.get('full_name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();

  // We pass the full_name in the metadata to be used by the trigger
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (error) {
    console.error('Signup Error:', error);
    return { error: 'Não foi possível registrar o usuário. O email pode já estar em uso.' };
  }
  
  if (data.user) {
    // This is for local development where email confirmation might not be set up.
    // In production, the user would be redirected to a "please confirm your email" page.
     redirect('/dashboard');
  }

  return { error: null, success: true };
}
