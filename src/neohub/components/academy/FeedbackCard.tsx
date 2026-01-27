import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface FeedbackWithAuthor {
  feedback: string;
  userName: string;
  avatarUrl?: string | null;
}

interface FeedbackCardProps {
  item: FeedbackWithAuthor;
  variant?: 'positive' | 'improvement' | 'neutral';
  className?: string;
  /** If true, card spans full width regardless of content length */
  forceFullWidth?: boolean;
}

const variantStyles = {
  positive: {
    card: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    divider: 'border-emerald-200 dark:border-emerald-700',
    fallback: 'bg-emerald-100 text-emerald-700',
  },
  improvement: {
    card: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    divider: 'border-amber-200 dark:border-amber-700',
    fallback: 'bg-amber-100 text-amber-700',
  },
  neutral: {
    card: 'bg-muted/50 border-border',
    divider: 'border-border',
    fallback: 'bg-muted text-muted-foreground',
  },
};

/**
 * Check if feedback text is "long" (>80 chars) for layout purposes
 */
export const isLongFeedback = (text: string) => text.length > 80;

/**
 * Get initials from a name (first 2 letters of first and last name)
 */
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

/**
 * Reusable FeedbackCard component that always shows author name and avatar.
 * Rule: Every quote/feedback must identify who said it.
 */
export function FeedbackCard({ 
  item, 
  variant = 'neutral', 
  className,
  forceFullWidth = false 
}: FeedbackCardProps) {
  const styles = variantStyles[variant];
  const isLong = isLongFeedback(item.feedback) || forceFullWidth;

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border",
        styles.card,
        isLong && "sm:col-span-2 lg:col-span-3",
        className
      )}
    >
      <p className="text-sm mb-2 leading-relaxed">{item.feedback}</p>
      <div className={cn("flex items-center gap-2 pt-2 border-t", styles.divider)}>
        <Avatar className="h-5 w-5">
          <AvatarImage src={item.avatarUrl || undefined} />
          <AvatarFallback className={cn("text-[10px]", styles.fallback)}>
            {getInitials(item.userName)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground font-medium">
          {item.userName}
        </span>
      </div>
    </div>
  );
}

/**
 * Grid container for feedback cards with responsive columns
 */
export function FeedbackGrid({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Empty state for when there are no feedbacks
 */
export function FeedbackEmpty({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground col-span-full text-center py-4">
      {message}
    </p>
  );
}
