/**
 * LeadSourceAvatar - Avatar reutilizável com ícone de fonte do lead
 * Exibe o ícone da plataforma de origem (WhatsApp, Instagram, etc.)
 * - WhatsApp API não oficial (UazAPI): ícone outline
 * - WhatsApp API oficial: ícone preenchido verde
 * - Instagram: ícone do Instagram
 */

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeadSourceAvatarProps {
  name: string;
  source?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const badgeSizeClasses = {
  sm: 'w-4 h-4 -bottom-0.5 -right-0.5',
  md: 'w-5 h-5 -bottom-0.5 -right-0.5',
  lg: 'w-6 h-6 -bottom-1 -right-1',
};

const iconSizeClasses = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
};

// Check if the source is WhatsApp official API
const isOfficialWhatsAppAPI = (source: string | null): boolean => {
  if (!source) return false;
  const normalized = source.toLowerCase().trim();
  return normalized.includes('official') || 
         normalized.includes('oficial') ||
         normalized.includes('cloud') ||
         normalized.includes('business_api');
};

// Check if source is WhatsApp (any type)
const isWhatsAppSource = (source: string | null): boolean => {
  if (!source) return false;
  const normalized = source.toLowerCase().trim();
  return normalized.includes('whatsapp') || 
         normalized.includes('uazapi') || 
         normalized === 'wpp';
};

// Check if source is Instagram
const isInstagramSource = (source: string | null): boolean => {
  if (!source) return false;
  const normalized = source.toLowerCase().trim();
  return normalized.includes('instagram') || normalized === 'ig';
};

// Check if source is Facebook
const isFacebookSource = (source: string | null): boolean => {
  if (!source) return false;
  const normalized = source.toLowerCase().trim();
  return normalized.includes('facebook') || normalized === 'fb';
};

// WhatsApp icon component - Outline version (unofficial API)
function WhatsAppIconOutline({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Za" />
      <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
    </svg>
  );
}

// WhatsApp icon component - Filled version (official API)
function WhatsAppIconFilled({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

// Instagram icon component
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// Facebook icon component
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export function LeadSourceAvatar({ 
  name, 
  source, 
  avatarUrl,
  size = 'md',
  className 
}: LeadSourceAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const renderSourceBadge = () => {
    const isWhatsApp = isWhatsAppSource(source);
    const isOfficial = isOfficialWhatsAppAPI(source);
    const isInstagram = isInstagramSource(source);
    const isFacebook = isFacebookSource(source);

    if (isWhatsApp) {
      if (isOfficial) {
        // Official WhatsApp API - filled green icon
        return (
          <div 
            className={cn(
              "absolute rounded-full bg-green-500 border-2 border-[hsl(var(--avivar-card))] flex items-center justify-center",
              badgeSizeClasses[size]
            )}
            title="WhatsApp API Oficial"
          >
            <WhatsAppIconFilled className={cn("text-white", iconSizeClasses[size])} />
          </div>
        );
      } else {
        // Unofficial WhatsApp API (UazAPI, etc.) - outline icon with border
        return (
          <div 
            className={cn(
              "absolute rounded-full bg-[hsl(var(--avivar-card))] border-2 border-green-500 flex items-center justify-center",
              badgeSizeClasses[size]
            )}
            title="WhatsApp"
          >
            <WhatsAppIconFilled className={cn("text-green-500", iconSizeClasses[size])} />
          </div>
        );
      }
    }

    if (isInstagram) {
      return (
        <div 
          className={cn(
            "absolute rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 border-2 border-[hsl(var(--avivar-card))] flex items-center justify-center",
            badgeSizeClasses[size]
          )}
          title="Instagram"
        >
          <InstagramIcon className={cn("text-white", iconSizeClasses[size])} />
        </div>
      );
    }

    if (isFacebook) {
      return (
        <div 
          className={cn(
            "absolute rounded-full bg-blue-600 border-2 border-[hsl(var(--avivar-card))] flex items-center justify-center",
            badgeSizeClasses[size]
          )}
          title="Facebook"
        >
          <FacebookIcon className={cn("text-white", iconSizeClasses[size])} />
        </div>
      );
    }

    // Default - no badge or generic indicator
    return null;
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={cn(
        sizeClasses[size],
        "border-2 border-[hsl(var(--avivar-border))]"
      )}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] text-white font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {renderSourceBadge()}
    </div>
  );
}
