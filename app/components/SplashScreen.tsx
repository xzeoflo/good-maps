"use client";

import { useEffect } from "react";
import GoodMapsLogo from "./GoodMapsLogo";

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white">
      <GoodMapsLogo size="lg" />
    </div>
  );
}
