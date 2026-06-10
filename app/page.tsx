"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import SplashScreen from "./components/SplashScreen";
import ProfileForm, { UserProfile } from "./components/ProfileForm";

const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

type Screen = "splash" | "profile" | "map";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  function handleProfileSubmit(p: UserProfile) {
    setProfile(p);
    setScreen("map");
  }

  return (
    <div className="app-container">
      {screen === "splash" && (
        <SplashScreen onDone={() => setScreen("profile")} />
      )}
      {screen === "profile" && (
        <ProfileForm
          onSubmit={handleProfileSubmit}
          initialProfile={profile ?? undefined}
        />
      )}
      {screen === "map" && profile && (
        <MapView
          needs={profile.needs}
          initialCity={profile.city}
          onBack={() => setScreen("profile")}
        />
      )}
    </div>
  );
}
