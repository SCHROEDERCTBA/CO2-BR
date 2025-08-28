
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { Button } from '../ui/button';

export type ChartData = { date: string; pedidos: number };
type Period = '7d' | '30d' | '365d';

interface AdminDashboardClientProps {
  initialData: ChartData[];
  initialPeriod: Period;
}

export function AdminDashboardClient({ initialData, initialPeriod }: AdminDashboardClientProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    router.push(`/dashboard?range=${newPeriod}`, { scroll: false });
  };

  const periodLabels: Record<Period, string> = {
      '7d': 'Últimos 7 dias',
      '30d': 'Últimos 30 dias',
      '365d': 'Último ano'
  }

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Pedidos ({periodLabels[period]})</CardTitle>
        <div className="flex items-center gap-2">
            <Button size="sm" variant={period === '7d' ? 'default' : 'outline'} onClick={() => handlePeriodChange('7d')}>7D</Button>
            <Button size="sm" variant={period === '30d' ? 'default' : 'outline'} onClick={() => handlePeriodChange('30d')}>30D</Button>
            <Button size="sm" variant={period === '365d' ? 'default' : 'outline'} onClick={() => handlePeriodChange('365d')}>1A</Button>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <SalesChart data={initialData} />
      </CardContent>
    </Card>
  );
}
