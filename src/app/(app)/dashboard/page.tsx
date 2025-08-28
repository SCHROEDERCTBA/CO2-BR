
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  ShoppingCart,
  Users,
  CheckCircle,
  Clock,
  Truck,
  ArrowUpRight,
  Wrench,
  DollarSign,
  XCircle,
} from 'lucide-react';
import type { Order, UserProfile } from '@/lib/types';
import { redirect } from 'next/navigation';
import { OrderFormSheet } from '@/components/orders/order-form-sheet';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { AssemblyActions } from '@/components/orders/assembly-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AdminDashboardClient, type ChartData } from '@/components/dashboard/admin-dashboard-client';

type Period = '7d' | '30d' | '365d';

async function AdminDashboard({ period }: { period: Period }) {
  const supabase = createClient();
  
  const days = period === '7d' ? 7 : (period === '30d' ? 30 : 365);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  const dateTrunc = period === '365d' ? 'month' : 'day';

  const statsPromises = {
    pending: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDENTE'),
    sent: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ENVIADO'),
    cancelled: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CANCELADO'),
    products: supabase
      .from('products')
      .select('*', { count: 'exact', head: true }),
    users: supabase.from('users').select('*', { count: 'exact', head: true }),
  };

  const recentOrdersPromise = supabase
    .from('orders')
    .select(
      `
      id,
      customer_name,
      created_at,
      status,
      total_amount,
      order_items(quantity, unit_price, total_price)
    `
    )
    .order('created_at', { ascending: false })
    .limit(5);

  const ordersForChartPromise = supabase
    .rpc('get_orders_by_period', { from_date: fromDate.toISOString(), trunc_by: dateTrunc });

  // Calcular faturamento total (pedidos ENVIADO)
  const totalRevenuePromise = supabase
    .from('orders')
    .select('total_amount, order_items(quantity, unit_price, total_price)')
    .eq('status', 'ENVIADO');

  // Buscar dados de faturamento por período para gráfico de receita
  const revenueChartPromise = supabase
    .from('orders')
    .select(`
      async function AdminDashboard({ period }: { period: Period }) {
  const supabase = createClient();
  
  const days = period === '7d' ? 7 : (period === '30d' ? 30 : 365);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  
  const dateTrunc = period === '365d' ? 'month' : 'day';

  const statsPromises = {
    pending: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDENTE'),
    sent: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ENVIADO'),
    cancelled: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CANCELADO'),
    products: supabase
      .from('products')
      .select('*', { count: 'exact', head: true }),
    users: supabase.from('users').select('*', { count: 'exact', head: true }),
  };

  const recentOrdersPromise = supabase
    .from('orders')
    .select('
      id,
      customer_name,
      created_at,
      status,
      total_amount,
      order_items(quantity, unit_price, total_price)
    ')
    .order('created_at', { ascending: false })
    .limit(5);

  // Single, efficient RPC call for both charts
  const chartDataPromise = supabase
    .rpc('get_orders_by_period', { from_date: fromDate.toISOString(), trunc_by: dateTrunc });

  // Calculate total revenue (for the stat card)
  const totalRevenuePromise = supabase
    .from('orders')
    .select('total_amount, order_items(quantity, unit_price, total_price)')
    .eq('status', 'ENVIADO');

  const [
    statsResults,
    recentOrdersResult,
    chartDataResult,
    totalRevenueResult,
  ] = await Promise.all([
    Promise.all(Object.values(statsPromises)).then(results =>
      Object.keys(statsPromises).reduce((acc, key, index) => {
        acc[key as keyof typeof statsPromises] = results[index];
        return acc;
      }, {} as any)
    ),
    recentOrdersPromise,
    chartDataPromise,
    totalRevenuePromise,
  ]);

  // Calculate total revenue for the stat card
  const totalRevenue = (totalRevenueResult.data || []).reduce((total, order) => {
    const orderTotal = order.total_amount || 
      order.order_items?.reduce((acc: number, item: any) => 
        acc + (item.total_price || item.unit_price * item.quantity), 0
      ) || 0;
    return total + orderTotal;
  }, 0);

  const stats = {
    pending: statsResults.pending.count ?? 0,
    sent: statsResults.sent.count ?? 0,
    cancelled: statsResults.cancelled.count ?? 0,
    products: statsResults.products.count ?? 0,
    users: statsResults.users.count ?? 0,
    totalRevenue: totalRevenue,
  };
  
  const recentOrders = recentOrdersResult.data || [];
  
  const rawChartData = chartDataResult.data || [];

  const salesChartData: ChartData[] = rawChartData.map((d: any) => ({
      date: new Date(d.period).toLocaleDateString('pt-BR', { 
          month: period === '365d' ? 'short' : 'numeric', 
          day: period === '365d' ? undefined : 'numeric',
          timeZone: 'UTC'
      }),
      pedidos: d.order_count
  }));

  const revenueChartData = rawChartData.map((d: any) => ({
    date: new Date(d.period).toLocaleDateString('pt-BR', { 
      month: period === '365d' ? 'short' : 'numeric', 
      day: period === '365d' ? undefined : 'numeric',
      timeZone: 'UTC'
    }),
    receita: d.total_amount
  }));
    `)
    .eq('status', 'ENVIADO')
    .gte('created_at', fromDate.toISOString())
    .order('created_at', { ascending: true });

  const [
    statsResults,
    recentOrdersResult,
    ordersForChartResult,
    totalRevenueResult,
    revenueChartResult,
  ] = await Promise.all([
    Promise.all(Object.values(statsPromises)).then(results =>
      Object.keys(statsPromises).reduce((acc, key, index) => {
        acc[key as keyof typeof statsPromises] = results[index];
        return acc;
      }, {} as any)
    ),
    recentOrdersPromise,
    ordersForChartPromise,
    totalRevenuePromise,
    revenueChartPromise,
  ]);

  // Calcular faturamento total
  const totalRevenue = (totalRevenueResult.data || []).reduce((total, order) => {
    const orderTotal = order.total_amount || 
      order.order_items?.reduce((acc: number, item: any) => 
        acc + (item.total_price || item.unit_price * item.quantity), 0
      ) || 0;
    return total + orderTotal;
  }, 0);

  const stats = {
    pending: statsResults.pending.count ?? 0,
    sent: statsResults.sent.count ?? 0,
    cancelled: statsResults.cancelled.count ?? 0,
    products: statsResults.products.count ?? 0,
    users: statsResults.users.count ?? 0,
    totalRevenue: totalRevenue,
  };
  
  const recentOrders = recentOrdersResult.data || [];
  
  const chartData: ChartData[] = (ordersForChartResult.data || []).map((d: any) => ({
      date: new Date(d.date_trunc).toLocaleDateString('pt-BR', { 
          month: period === '365d' ? 'short' : 'numeric', 
          day: period === '365d' ? undefined : 'numeric',
          timeZone: 'UTC' // Important for consistency
      }),
      pedidos: d.count
  }));

  // Preparar dados para gráfico de receita
  const revenueData = (revenueChartResult.data || []).reduce((acc: any[], order: any) => {
    const orderDate = new Date(order.created_at);
    const dateKey = dateTrunc === 'month' 
      ? `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`
      : orderDate.toISOString().split('T')[0];
    
    const orderTotal = order.total_amount || 
      order.order_items?.reduce((sum: number, item: any) => 
        sum + (item.total_price || item.unit_price * item.quantity), 0
      ) || 0;

    const existingEntry = acc.find(entry => entry.date === dateKey);
    if (existingEntry) {
      existingEntry.receita += orderTotal;
    } else {
      acc.push({
        date: dateKey,
        receita: orderTotal
      });
    }
    return acc;
  }, []);

  // Formatar datas para o gráfico de receita
  const revenueChartData = revenueData.map(d => ({
    date: new Date(d.date).toLocaleDateString('pt-BR', { 
      month: period === '365d' ? 'short' : 'numeric', 
      day: period === '365d' ? undefined : 'numeric',
      timeZone: 'UTC'
    }),
    receita: d.receita
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">aguardando envio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Enviados</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">entregues aos clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">pedidos cancelados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">pedidos enviados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminDashboardClient initialData={chartData} initialPeriod={period} />
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Faturamento por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueChartData} />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">
              Pedidos Recentes
            </CardTitle>
             <Button asChild variant="ghost" size="sm" className="text-sm">
                <Link href="/orders">
                    Ver todos <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {recentOrders.map((order: any) => {
                   const total = order.order_items.reduce((acc: number, item: any) => acc + item.quantity * item.unit_price, 0);
                   return (
                    <TableRow key={order.id}>
                        <TableCell>
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{order.id.substring(0,8)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                        </TableCell>
                         <TableCell className="text-right">
                             <Link href={`/orders/${order.id}`}>
                                <Button variant="outline" size="sm">Ver</Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                   )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function ConsultantDashboard({ userId }: { userId: string }) {
  const supabase = createClient();
  
  // Buscar contadores de pedidos
  const statsPromises = {
    approved: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'APPROVED')
      .eq('consultant_id', userId),
    sent: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SENT')
      .eq('consultant_id', userId),
  };

  // Buscar pedidos recentes
  const recentOrdersPromise = supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      status,
      total_amount,
      created_at,
      order_items(quantity, unit_price, total_price)
    `)
    .eq('consultant_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Buscar dados para gráfico (últimos 7 dias)
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  
  const chartDataPromise = supabase
    .rpc('get_orders_by_period', { 
      from_date: fromDate.toISOString(), 
      trunc_by: 'day' 
    });

  // Buscar produtos e categorias para o botão de novo pedido
  const productsPromise = supabase
    .from('products')
    .select(`
      id, name, description, price, category_id, image_url, 
      status, data_ai_hint, sku, weight, dimensions,
      stock_quantity, min_stock_level, created_at, updated_at
    `)
    .eq('status', 'ACTIVE')
    .order('name', { ascending: true });

  const categoriesPromise = supabase
    .from('categories')
    .select(`
      id, name, description, is_active, created_at, updated_at
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  const [
    statsResults,
    recentOrdersResult,
    chartDataResult,
    productsResult,
    categoriesResult,
  ] = await Promise.all([
    Promise.all(Object.values(statsPromises)).then(results =>
      Object.keys(statsPromises).reduce((acc, key, index) => {
        acc[key as keyof typeof statsPromises] = results[index];
        return acc;
      }, {} as any)
    ),
    recentOrdersPromise,
    chartDataPromise,
    productsPromise,
    categoriesPromise,
  ]);

  const stats = {
    approved: statsResults.approved.count ?? 0,
    sent: statsResults.sent.count ?? 0,
  };

  const recentOrders = recentOrdersResult.data || [];
  const chartData = chartDataResult.data || [];
  const products = productsResult.data || [];
  const categories = categoriesResult.data || [];

  return (
    <div className="space-y-6">
      {/* Botão de Novo Pedido */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Meus Pedidos</h2>
        <OrderFormSheet products={products} categories={categories} />
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">prontos para montagem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">entregues aos clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico e Pedidos Recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={chartData} />
          </CardContent>
        </Card>

        {/* Pedidos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum pedido encontrado
                </p>
              ) : (
                recentOrders.map((order) => {
                  const total = order.total_amount || 
                    order.order_items?.reduce((acc: number, item: any) => 
                      acc + (item.total_price || item.unit_price * item.quantity), 0
                    ) || 0;
                  
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          }).format(total)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          order.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          order.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'APPROVED' ? 'Aprovado' :
                           order.status === 'SENT' ? 'Enviado' : 'Desconhecido'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function AssemblerDashboard() {
  const supabase = createClient();
  
  // Buscar contadores de pedidos
  const statsPromises = {
    pending: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDENTE'),
    sent: supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ENVIADO'),
  };

  // Buscar pedidos para montagem (PENDENTE)
  const ordersToAssemblePromise = supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      status,
      total_amount,
      created_at,
      priority,
      estimated_delivery_date,
      order_items(quantity, unit_price, total_price, product_name)
    `)
    .eq('status', 'PENDENTE')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(10);

  // Buscar dados para gráfico (últimos 30 dias)
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  
  const chartDataPromise = supabase
    .rpc('get_orders_by_period', { 
      from_date: fromDate.toISOString(), 
      trunc_by: 'day' 
    });

  const [
    statsResults,
    ordersToAssembleResult,
    chartDataResult,
  ] = await Promise.all([
    Promise.all(Object.values(statsPromises)).then(results =>
      Object.keys(statsPromises).reduce((acc, key, index) => {
        acc[key as keyof typeof statsPromises] = results[index];
        return acc;
      }, {} as any)
    ),
    ordersToAssemblePromise,
    chartDataPromise,
  ]);

  const stats = {
    pending: statsResults.pending.count ?? 0,
    sent: statsResults.sent.count ?? 0,
  };

  const ordersToAssemble = ordersToAssembleResult.data || [];
  const chartData = chartDataResult.data || [];

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Central de Montagem</h2>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Para Montar</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">aguardando montagem</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">enviados aos clientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico e Fila de Montagem */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Produção */}
        <Card>
          <CardHeader>
            <CardTitle>Produção (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={chartData} />
          </CardContent>
        </Card>

        {/* Fila de Montagem */}
        <Card>
          <CardHeader>
            <CardTitle>Fila de Montagem</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ordenado por prioridade e data
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordersToAssemble.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum pedido na fila de montagem
                  </p>
                </div>
              ) : (
                ordersToAssemble.map((order) => {
                  const total = order.total_amount || 
                    order.order_items?.reduce((acc: number, item: any) => 
                      acc + (item.total_price || item.unit_price * item.quantity), 0
                    ) || 0;
                  
                  const itemsCount = order.order_items?.length || 0;
                  const isUrgent = order.priority >= 4;
                  const isOverdue = order.estimated_delivery_date && 
                    new Date(order.estimated_delivery_date) < new Date();
                  
                  return (
                    <div 
                      key={order.id} 
                      className={`p-4 border rounded-lg space-y-3 ${
                        isUrgent ? 'border-red-200 bg-red-50' : 
                        isOverdue ? 'border-orange-200 bg-orange-50' : 
                        'border-gray-200'
                      }`}
                    >
                      {/* Cabeçalho do pedido */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{order.customer_name}</p>
                            {isUrgent && (
                              <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                Urgente
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                                Atrasado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {itemsCount} {itemsCount === 1 ? 'item' : 'itens'} • 
                            Criado em {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          {order.estimated_delivery_date && (
                            <p className="text-xs text-muted-foreground">
                              Entrega: {new Date(order.estimated_delivery_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(total)}
                          </p>
                          <div className="flex items-center gap-1 justify-end">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div
                                key={i}
                                className={`h-2 w-2 rounded-full ${
                                  i < order.priority ? 'bg-blue-500' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="flex justify-end">
                        <AssemblyActions order={order} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string };
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
    .select('role, id')
    .eq('id', user.id)
    .single<Pick<UserProfile, 'role' | 'id'>>();

  if (!profile) {
    await supabase.auth.signOut();
    return redirect('/login');
  }
  
  const range = searchParams.range === '30d' ? '30d' : (searchParams.range === '365d' ? '365d' : '7d');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {profile.role === 'ADMIN' && <AdminDashboard period={range} />}
      {profile.role === 'CONSULTANT' && (
        <ConsultantDashboard userId={profile.id} />
      )}
      {profile.role === 'ASSEMBLER' && <AssemblerDashboard />}
    </div>
  );
}
