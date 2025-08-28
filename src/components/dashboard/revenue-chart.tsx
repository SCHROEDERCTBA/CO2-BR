'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig
} from '@/components/ui/chart';

const chartConfig = {
    receita: {
        label: "Faturamento",
        color: "hsl(142, 76%, 36%)", // Verde para dinheiro
    },
} satisfies ChartConfig

interface RevenueChartProps {
    data: { date: string; receita: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value, index) => {
                            if (data.length > 12 && index % 2 !== 0) return "";
                            if (value.includes('/')) return value.split('/')[0];
                            return value;
                        }}
                    />
                    <YAxis 
                        allowDecimals={false}
                        tickFormatter={formatCurrency}
                    />
                    <ChartTooltip 
                        cursor={false}
                        content={<ChartTooltipContent 
                            indicator="dot" 
                            labelFormatter={(label) => `Data: ${label}`}
                            formatter={(value) => [formatCurrency(Number(value)), 'Faturamento']}
                        />}
                    />
                    <Bar 
                        dataKey="receita" 
                        fill="var(--color-receita)" 
                        radius={4} 
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
