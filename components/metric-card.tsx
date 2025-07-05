import { DivideIcon as LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  status: string;
  statusColor: 'blue' | 'orange' | 'green' | 'red';
  icon: typeof LucideIcon;
  iconColor: 'blue' | 'orange' | 'green' | 'red';
}

const statusColorMap = {
  blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  green: 'bg-green-500/10 text-green-500 border-green-500/20',
  red: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const iconColorMap = {
  blue: 'text-blue-500',
  orange: 'text-orange-500',
  green: 'text-green-500',
  red: 'text-red-500',
};

export const MetricCard = memo(function MetricCard({
  title,
  value,
  status,
  statusColor,
  icon: Icon,
  iconColor,
}: MetricCardProps) {
  // Simplified progress calculation
  let percent = 60; // Default
  
  if (typeof value === 'string' && value.includes('°C')) {
    const temp = parseFloat(value.replace('°C', ''));
    if (!isNaN(temp)) {
      percent = Math.min(100, Math.max(0, (temp / 50) * 100));
    }
  } else if (typeof value === 'string' && value.includes('%')) {
    const humidity = parseFloat(value.replace('%', ''));
    if (!isNaN(humidity)) {
      percent = humidity;
    }
  }
  
  const ringColorMap = {
    blue: '#3B82F6',
    orange: '#F59E42',
    green: '#22C55E',
    red: '#EF4444',
  };
  const ringColor = ringColorMap[iconColor];
  
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/80 via-card to-card/60 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="w-full text-lg font-semibold text-foreground mb-3 text-center">{title}</div>
        <div className="relative flex items-center justify-center mb-3" style={{ width: 100, height: 100 }}>
          <svg width="100" height="100" className="transform -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
              fill="none"
              opacity="0.3"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke={ringColor}
              strokeWidth="6"
              fill="none"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * (1 - percent / 100)}
              strokeLinecap="round"
              style={{ 
                transition: 'stroke-dashoffset 0.8s ease-in-out',
                filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.3))'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={cn("w-8 h-8", iconColorMap[iconColor])} strokeWidth={2.5} />
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground mb-2 text-center tracking-tight">{value}</div>
        <div className="flex justify-center w-full">
          <Badge variant="secondary" className={cn("text-xs px-3 py-1 rounded-full font-medium", statusColorMap[statusColor])}>
            {status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
});