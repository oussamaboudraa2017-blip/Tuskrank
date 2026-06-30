import { cn } from '@/lib/utils';
import { gradeColor, gradeLetter } from '@/lib/types';

interface ScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const letter = gradeLetter(score);

  const sizeClasses = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  const colorMap = {
    'score-a': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'score-b': 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'score-c': 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'score-d': 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
    'score-f': 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const color = gradeColor(score);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2 font-bold',
        sizeClasses[size],
        colorMap[color],
      )}
    >
      {letter}
    </div>
  );
}

export function OverallScoreBadge({ score, size = 'lg' }: ScoreBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ScoreBadge score={score} size={size} />
      <p className="text-xs text-muted-foreground">Overall Score</p>
    </div>
  );
}

interface ScoreBarProps {
  score: number | null;
  label: string;
}

export function ScoreBar({ score, label }: ScoreBarProps) {
  const pct = score ?? 0;
  const barColor =
    pct >= 70
      ? 'bg-emerald-500'
      : pct >= 50
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{score !== null ? `${score}/100` : '—'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
