'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FormattedDateProps {
    date: string | Date;
    format?: string;
    prefix?: string;
    suffix?: string;
}

export function FormattedDate({ 
    date, 
    format: formatStr = "dd/MM/yyyy 'às' HH:mm", 
    prefix = '', 
    suffix = '' 
}: FormattedDateProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; // ou um placeholder/skeleton
    }

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formattedDate = format(dateObj, formatStr, { locale: ptBR });

    return (
        <span>
            {prefix}{formattedDate}{suffix}
        </span>
    );
}
