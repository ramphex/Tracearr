import { User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserCardProps {
  userId: string;
  username: string;
  thumbUrl?: string | null;
  serverId?: string | null;
  trustScore: number;
  playCount: number;
  watchTimeHours: number;
  topMediaType?: string | null;
  topContent?: string | null;
  rank: 1 | 2 | 3;
  className?: string;
}

function getAvatarUrl(serverId: string | null | undefined, thumbUrl: string | null | undefined, size = 100) {
  if (!thumbUrl) return null;
  // If thumbUrl is already a full URL (e.g., from Plex.tv), use it directly
  if (thumbUrl.startsWith('http')) return thumbUrl;
  // Otherwise, proxy through our server
  if (!serverId) return null;
  return `/api/v1/images/proxy?server=${serverId}&url=${encodeURIComponent(thumbUrl)}&width=${size}&height=${size}&fallback=avatar`;
}

function getTrustScoreColor(score: number) {
  if (score >= 80) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

function getTrustScoreBg(score: number) {
  if (score >= 80) return 'bg-green-500/20';
  if (score >= 50) return 'bg-yellow-500/20';
  return 'bg-red-500/20';
}

const MEDALS = {
  1: { emoji: '🥇', color: 'from-yellow-400 to-yellow-600', size: 'h-20 w-20' },
  2: { emoji: '🥈', color: 'from-gray-300 to-gray-500', size: 'h-16 w-16' },
  3: { emoji: '🥉', color: 'from-amber-600 to-amber-800', size: 'h-16 w-16' },
} as const;

export function UserCard({
  username,
  thumbUrl,
  serverId,
  trustScore,
  playCount,
  watchTimeHours,
  topContent,
  rank,
  className,
}: UserCardProps) {
  const avatarUrl = getAvatarUrl(serverId, thumbUrl);
  const medal = MEDALS[rank];

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center rounded-xl border bg-card p-6 text-center transition-all duration-300 hover:scale-[1.03] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
        rank === 1 && 'animate-fade-in-up border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-transparent',
        rank !== 1 && 'animate-fade-in',
        className
      )}
    >
      {/* Medal */}
      <div className="absolute -top-3 text-3xl">{medal.emoji}</div>

      {/* Avatar */}
      <div
        className={cn(
          'relative mt-4 overflow-hidden rounded-full bg-gradient-to-br shadow-lg',
          medal.color,
          medal.size
        )}
      >
        <div className="absolute inset-0.5 overflow-hidden rounded-full bg-card">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="mt-4 text-lg font-semibold">{username}</h3>

      {/* Stats */}
      <div className="mt-2 flex items-center gap-4 text-sm">
        <div>
          <span className="font-semibold text-primary">{playCount}</span>
          <span className="ml-1 text-muted-foreground">plays</span>
        </div>
        <div className="text-muted-foreground">{watchTimeHours}h</div>
      </div>

      {/* Trust Score */}
      <div
        className={cn(
          'mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
          getTrustScoreBg(trustScore),
          getTrustScoreColor(trustScore)
        )}
      >
        <Trophy className="h-3 w-3" />
        Trust: {trustScore}%
      </div>

      {/* Top Content */}
      {topContent && (
        <p className="mt-2 text-xs text-muted-foreground">
          Loves: <span className="font-medium">{topContent}</span>
        </p>
      )}
    </div>
  );
}
