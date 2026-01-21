import { useState } from "react";
import { Play, Maximize2, Volume2, VolumeX } from "lucide-react";
import { Video, useVideos } from "@/hooks/useVideos";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  video: Video;
  autoPlay?: boolean;
  className?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
  showControls?: boolean;
}

export function VideoPlayer({ 
  video, 
  autoPlay = false,
  className,
  aspectRatio = "16/9",
  showControls = true
}: VideoPlayerProps) {
  const { getEmbedUrl, isExternalVideo } = useVideos();
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  
  const embedUrl = getEmbedUrl(video);
  const isExternal = isExternalVideo(video);

  if (!embedUrl) {
    return (
      <div className={cn(
        "bg-muted rounded-lg flex items-center justify-center",
        className
      )} style={{ aspectRatio }}>
        <p className="text-muted-foreground">Vídeo não disponível</p>
      </div>
    );
  }

  // External video (YouTube/Vimeo) - use iframe
  if (isExternal) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden", className)} style={{ aspectRatio }}>
        {!isPlaying ? (
          // Thumbnail with play button
          <div 
            className="absolute inset-0 cursor-pointer group"
            onClick={() => setIsPlaying(true)}
          >
            {video.thumbnail_url ? (
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-muted-foreground">{video.title}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/90 group-hover:bg-primary flex items-center justify-center transition-colors shadow-lg">
                <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : (
          // Embedded player
          <iframe
            src={`${embedUrl}?autoplay=1&rel=0`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        )}
      </div>
    );
  }

  // Native video (uploaded file)
  return (
    <div className={cn("relative rounded-lg overflow-hidden group", className)} style={{ aspectRatio }}>
      <video
        src={embedUrl}
        className="w-full h-full object-cover"
        controls={showControls}
        autoPlay={autoPlay}
        muted={isMuted}
        playsInline
        poster={video.thumbnail_url || undefined}
      >
        Seu navegador não suporta vídeos.
      </video>
    </div>
  );
}

interface VideoCardProps {
  video: Video;
  onClick?: (video: Video) => void;
  className?: string;
}

export function VideoCard({ video, onClick, className }: VideoCardProps) {
  const { getEmbedUrl } = useVideos();
  
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={cn(
        "group cursor-pointer rounded-lg overflow-hidden bg-card border transition-all hover:shadow-lg hover:border-primary/50",
        className
      )}
      onClick={() => onClick?.(video)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Play className="h-12 w-12 text-primary/50" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-6 w-6 text-primary-foreground ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Duration badge */}
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.duration_seconds)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}
