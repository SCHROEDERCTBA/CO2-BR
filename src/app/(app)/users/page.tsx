import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/lib/types";
import { UsersTable } from "@/components/users/users-table";
import { UserDialog } from "@/components/users/user-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function UsersPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: UserProfile['role'] }>();

    if (profile?.role !== 'ADMIN') {
        return redirect('/dashboard');
    }

    const { data: users, error: usersError } = await supabase
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
        `);

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return <div>Error loading users.</div>;
    }
    
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
                <UserDialog>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Usuário
                    </Button>
                </UserDialog>
            </div>
            <UsersTable data={users || []} />
        </div>
    );
}
