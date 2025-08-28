
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserRole } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';

async function checkAdmin() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Usuário não autenticado.');
    }
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: UserRole }>();

    if (profile?.role !== 'ADMIN') {
        throw new Error('Acesso não autorizado.');
    }
    return user;
}

export async function upsertUser(prevState: any, formData: FormData) {
  try {
    const loggedInUser = await checkAdmin();
    
    const id = formData.get('id') as string;
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;

    if (id === loggedInUser.id && role !== 'ADMIN') {
        return { error: 'Você não pode alterar sua própria função para algo diferente de ADMIN.' };
    }

    const supabaseAdmin = createAdminClient();

    if (id) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .update({ full_name: fullName, role, email })
        .eq('id', id);

      if (profileError) {
        console.error('Update Profile Error:', profileError);
        return { error: 'Não foi possível atualizar o perfil do usuário.' };
      }
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName
        }
      });

      if (authError) {
        console.error('Auth Error:', authError);
        return { error: 'Não foi possível criar o usuário. O email pode já estar em uso.' };
      }

      if (!authData.user) {
          return { error: 'Falha ao criar usuário na autenticação.' };
      }

      // The trigger will create the user profile, we just need to update the role if it's not the default
      if (role !== 'CONSULTANT') {
          const { error: roleUpdateError } = await supabaseAdmin
              .from('users')
              .update({ role, email }) // also sync the email here
              .eq('id', authData.user.id);

          if (roleUpdateError) {
              console.error('Initial Role Update Error:', roleUpdateError);
              // If this fails, we should ideally roll back the user creation, but for now, we'll just log it.
              return { error: 'Usuário criado, mas não foi possível definir a função inicial.' };
          }
      }
    }

    revalidatePath('/users');
    return { success: true, data: { full_name: fullName } };
  } catch (error: any) {
    return { error: error.message };
  }
}


export async function deleteUser(userId: string) {
    const loggedInUser = await checkAdmin();
    if(userId === loggedInUser.id) {
        throw new Error('Não é possível excluir a própria conta.');
    }

    const supabaseAdmin = createAdminClient();
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
        console.error('Delete Auth User Error:', authError);
        // This might happen if the user is referenced by foreign keys.
        throw new Error('Não foi possível excluir o usuário. Pode haver pedidos ou outros dados associados a ele.');
    }

    // The user deletion is cascaded to the public.users table by a trigger.
    revalidatePath('/users');
}
