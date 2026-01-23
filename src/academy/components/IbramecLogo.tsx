import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import ibramecLogoLight from "@/assets/ibramec-logo.png";
import ibramecLogoDark from "@/assets/ibramec-logo-white.png";

interface IbramecLogoProps {
  className?: string;
  alt?: string;
}

export function IbramecLogo({ 
  className = "h-8 object-contain", 
  alt = "IBRAMEC - Instituto Brasileiro de Medicina Capilar" 
}: IbramecLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <img src={ibramecLogoLight} alt={alt} className={className} />;
  }

  const logo = resolvedTheme === "dark" ? ibramecLogoDark : ibramecLogoLight;

  return <img src={logo} alt={alt} className={className} />;
}

export function IbramecIcon({ 
  className = "h-10 w-10 object-cover rounded-lg" 
}: { className?: string }) {
  return (
    <img 
      src={new URL("@/assets/ibramec-icon.png", import.meta.url).href}
      alt="IBRAMEC" 
      className={className}
    />
  );
}
