import { DivideIcon as LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

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

export function MetricCard({
  title,
  value,
  status,
  statusColor,
  icon: Icon,
  iconColor,
}: MetricCardProps) {
  // For demo, use 60% as the progress (can be dynamic if needed)
  const percent = 60;
  const ringColorMap = {
    blue: '#3B82F6',
    orange: '#F59E42',
    green: '#22C55E',
    red: '#EF4444',
  };
  const ringColor = ringColorMap[iconColor];
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-md">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="w-full text-lg font-semibold text-gray-700 mb-2 text-center">{title}</div>
        <div className="relative flex items-center justify-center mb-2" style={{ width: 100, height: 100 }}>
          <svg width="100" height="100">
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke={ringColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * (1 - percent / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className={cn("w-8 h-8", iconColorMap[iconColor])} />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1 text-center">{value}</div>
        <div className="flex justify-center w-full">
          <Badge variant="secondary" className={cn("text-xs px-3 py-1 rounded-full", statusColorMap[statusColor])}>
            {status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}