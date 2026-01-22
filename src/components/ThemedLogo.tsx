import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import logoByNeofolicLight from "@/assets/logo-byneofolic.png";
import logoByNeofolicDark from "@/assets/logo-byneofolic-dark.png";

interface ThemedLogoProps {
  className?: string;
  alt?: string;
}

export function ThemedLogo({ className = "h-8 object-contain", alt = "ByNeofolic" }: ThemedLogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return light logo as default during SSR/hydration
    return <img src={logoByNeofolicLight} alt={alt} className={className} />;
  }

  // Use resolvedTheme to handle "system" theme correctly
  const currentTheme = resolvedTheme || theme;
  const logo = currentTheme === "dark" ? logoByNeofolicDark : logoByNeofolicLight;

  return <img src={logo} alt={alt} className={className} />;
}
