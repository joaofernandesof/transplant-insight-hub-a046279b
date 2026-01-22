import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { cn } from "@/lib/utils";

interface AnnouncementBannerProps {
  moduleKey?: string;
  className?: string;
}

export default function AnnouncementBanner({ moduleKey, className }: AnnouncementBannerProps) {
  const { data: announcements, isLoading } = useAnnouncements(moduleKey);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate carousel
  useEffect(() => {
    if (!announcements?.length || announcements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [announcements?.length, isPaused]);

  if (isLoading || !announcements?.length) {
    return null;
  }

  const announcement = announcements[currentIndex];
  const hasMultiple = announcements.length > 1;

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-xl overflow-hidden mb-6 transition-all duration-500",
        className
      )}
      style={{
        backgroundColor: announcement.background_color || "#1e3a5f",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Content */}
      <div className="relative px-6 py-5 md:py-6 flex flex-col md:flex-row items-center gap-4">
        {/* Left arrow */}
        {hasMultiple && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Image */}
        {announcement.image_url && (
          <div className="flex-shrink-0 hidden md:block">
            <img
              src={announcement.image_url}
              alt=""
              className="h-16 w-auto max-w-[200px] object-contain rounded-lg"
            />
          </div>
        )}

        {/* Text content */}
        <div className="flex-1 text-center md:text-left px-8 md:px-4">
          <h3
            className="text-lg md:text-xl font-bold mb-1"
            style={{ color: announcement.text_color || "#ffffff" }}
          >
            {announcement.title}
          </h3>
          {announcement.description && (
            <p
              className="text-sm md:text-base opacity-90"
              style={{ color: announcement.text_color || "#ffffff" }}
            >
              {announcement.description}
            </p>
          )}
        </div>

        {/* CTA Button */}
        {announcement.link_url && (
          <div className="flex-shrink-0">
            <Button
              asChild
              className="gap-2 font-semibold"
              style={{
                backgroundColor: announcement.accent_color || "#06b6d4",
                color: "#ffffff",
              }}
            >
              <a href={announcement.link_url} target="_blank" rel="noopener noreferrer">
                {announcement.link_text || "Saiba mais"}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        {/* Right arrow */}
        {hasMultiple && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dots indicator */}
      {hasMultiple && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {announcements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === currentIndex
                  ? "w-4 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}

      {/* Decorative elements */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
        style={{ backgroundColor: announcement.accent_color || "#06b6d4" }}
      />
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-5 translate-y-1/2 -translate-x-1/2"
        style={{ backgroundColor: announcement.accent_color || "#06b6d4" }}
      />
    </div>
  );
}
