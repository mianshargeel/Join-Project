export interface Contact {
    id: string;
    name: string;
    mail: string; //changed by Shardzhil
    phone: string;
    color: string;
    initials: string;
}

const colorPalette: string[] = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16',
    '#F97316', '#6366F1', '#22D3EE', '#A855F7', '#14B8A6', '#F43F5E', '#0EA5E9', '#2563EB',
    '#7C3AED', '#0D9488', '#D97706', '#DC2626', '#0891B2', '#DB2777', '#65A30D', '#EA580C',
    '#4F46E5', '#06AED4', '#9333EA', '#0F766E', '#E11D48', '#0284C7', '#1D4ED8', '#6D28D9',
    '#115E59', '#B45309', '#B91C1C', '#0E7490', '#BE185D', '#4D7C0F', '#C2410C', '#4338CA',
];

export function generateInitials(name: string): string {
    return name.split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase();
}

export function generateRandomColor(): string {
    const index = Math.floor(Math.random() * colorPalette.length);
    return colorPalette[index];
}