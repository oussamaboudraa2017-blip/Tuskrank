import { gradeColor, gradeLetter } from '@/lib/types';
import { classNames } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const color = gradeColor(score);
  const letter = gradeLetter(score);
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  return (
    <div
      className={classNames(
        'flex items-center justify-center rounded-full border-2 font-bold',
        sizeClasses[size],
        score !== null && score >= 70
          ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
          : score !== null && score >= 50
            ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
            : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
      )}
    >
      {letter}
    </div>
  );
}

interface ScoreBarProps {
  score: number | null;
  label: string;
}

export function ScoreBar({ score, label }: ScoreBarProps) {
  const pct = score ?? 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-medium">{score !== null ? `${score}/100` : '—'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        <div
          className={classNames(
            'h-full rounded-full transition-all',
            pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
