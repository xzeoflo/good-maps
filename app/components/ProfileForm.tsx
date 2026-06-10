"use client";

import { useState } from "react";
import GoodMapsLogo from "./GoodMapsLogo";

export interface UserProfile {
  name: string;
  city: string;
  needs: string[];
}

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
}

const ACCESSIBILITY_OPTIONS = [
  { id: "wheelchair", label: "Fauteuil roulant", icon: "♿", description: "Accès PMR, rampes, ascenseurs" },
  { id: "blind",      label: "Malvoyant / Aveugle", icon: "👁️", description: "Guidage sonore, braille" },
  { id: "deaf",       label: "Malentendant / Sourd", icon: "🦻", description: "Boucle magnétique, LSF" },
  { id: "cognitive",  label: "Handicap cognitif", icon: "🧠", description: "Signalétique simplifiée" },
  { id: "motor",      label: "Mobilité réduite", icon: "🦽", description: "Espaces larges, pas de marches" },
  { id: "toilet",     label: "Toilettes adaptées", icon: "🚻", description: "WC accessibles PMR" },
];

export default function ProfileForm({ onSubmit, initialProfile }: ProfileFormProps) {
  const [name, setName] = useState(initialProfile?.name ?? "");
  const [city, setCity] = useState(initialProfile?.city ?? "");
  const [selected, setSelected] = useState<string[]>(initialProfile?.needs ?? []);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    if (selected.length === 0) return;
    onSubmit({ name: name.trim(), city: city.trim(), needs: selected });
  }

  return (
    <div className="relative flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-center px-5 pt-10 pb-4">
        <GoodMapsLogo size="sm" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <h2 className="text-xl font-bold text-center mb-1">Bienvenue !</h2>
        <p className="text-sm text-gray-500 text-center mb-5">
          Pour mieux personnaliser vos suggestions d&apos;activités, merci de
          remplir le formulaire.
        </p>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Votre prénom (optionnel)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Marie"
            className="w-full h-11 px-4 rounded-full bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* City */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Votre ville de recherche (optionnel)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder='Ex : "Paris", "Lyon", "Bordeaux"'
              className="w-full h-11 pl-10 pr-4 rounded-full bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 pl-2">
            La carte s&apos;ouvrira directement sur cette ville.
          </p>
        </div>

        {/* Accessibility needs */}
        <p className="text-sm font-medium text-gray-700 mb-3">
          Vos besoins d&apos;accessibilité *
        </p>
        <div className="flex flex-col gap-3">
          {ACCESSIBILITY_OPTIONS.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-primary bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-gray-800"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-400">{opt.description}</p>
                </div>
                {isSelected && (
                  <span className="ml-auto text-primary text-lg">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 py-4 border-t border-gray-100">
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full h-12 rounded-full bg-primary text-white font-bold text-sm tracking-wide disabled:opacity-40 transition-opacity active:scale-95"
        >
          Passer à la carte
        </button>
      </div>
    </div>
  );
}
