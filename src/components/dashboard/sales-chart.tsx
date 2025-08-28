
'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig
} from '@/components/ui/chart';

const chartConfig = {
    pedidos: {
        label: "Pedidos",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig

interface SalesChartProps {
    data: { date: string; pedidos: number }[];
}

export function SalesChart({ data }: SalesChartProps) {

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
                    <YAxis allowDecimals={false}/>
                    <ChartTooltip 
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar 
                        dataKey="pedidos" 
                        fill="var(--color-pedidos)" 
                        radius={4} 
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
