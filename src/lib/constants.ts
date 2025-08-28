import { LayoutDashboard, ShoppingCart, Package, Users } from 'lucide-react';
import type { UserRole } from './types';

export const NAV_LINKS = {
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/orders', label: 'Pedidos', icon: ShoppingCart },
    { href: '/catalog', label: 'Catálogo', icon: Package },
    { href: '/users', label: 'Usuários', icon: Users },
  ],
  CONSULTANT: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/orders', label: 'Meus Pedidos', icon: ShoppingCart },
  ],
  ASSEMBLER: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/orders', label: 'Pedidos para Montagem', icon: ShoppingCart },
  ],
};

export const getNavLinks = (role: UserRole) => {
  return NAV_LINKS[role] || [];
};
