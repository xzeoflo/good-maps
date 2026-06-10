"use client";

import type { AccessiblePlace } from "../types";

interface PlaceDetailProps {
  place: AccessiblePlace;
  typeLabel: string;
  needs: string[];
  onClose: () => void;
}

const WHEELCHAIR_LABELS: Record<string, string> = {
  yes:     "Entièrement accessible PMR",
  limited: "Partiellement accessible",
  no:      "Non accessible",
  unknown: "Accessibilité PMR non renseignée",
};
const WHEELCHAIR_COLORS: Record<string, string> = {
  yes:     "text-green-600",
  limited: "text-orange-500",
  no:      "text-red-500",
  unknown: "text-gray-400",
};

// Chaque need → liste de badges à afficher si le tag OSM correspondant existe
type Badge = { icon: string; label: string; color: string };

function getAccessibilityBadges(needs: string[], tags: Record<string, string>, wc: string, toiletWc: boolean): Badge[] {
  const badges: Badge[] = [];

  // ── Fauteuil roulant / mobilité réduite ──
  if (needs.includes("wheelchair") || needs.includes("motor")) {
    badges.push({
      icon: "♿",
      label: WHEELCHAIR_LABELS[wc] || WHEELCHAIR_LABELS.unknown,
      color: WHEELCHAIR_COLORS[wc] || "text-gray-400",
    });
    if (toiletWc) {
      badges.push({ icon: "🚻", label: "Toilettes PMR disponibles", color: "text-green-600" });
    }
    if (tags.ramp === "yes" || tags["kerb:lowered"] === "yes") {
      badges.push({ icon: "🔽", label: "Rampe / trottoir abaissé", color: "text-green-600" });
    }
    if (tags.elevator === "yes") {
      badges.push({ icon: "🛗", label: "Ascenseur disponible", color: "text-green-600" });
    }
  }

  // ── Malvoyant / Aveugle ──
  if (needs.includes("blind")) {
    const hasTactile = tags.tactile_paving === "yes";
    const hasSpeech  = tags.speech_output === "yes" || tags["blind:description"];
    badges.push({
      icon: "👁️",
      label: hasTactile ? "Bandes podotactiles présentes" : "Bandes podotactiles : non renseigné",
      color: hasTactile ? "text-green-600" : "text-gray-400",
    });
    if (hasSpeech) {
      badges.push({ icon: "🔊", label: "Guidage sonore disponible", color: "text-green-600" });
    }
  }

  // ── Malentendant / Sourd ──
  if (needs.includes("deaf")) {
    const hasLoop = tags.hearing_loop === "yes" || tags.induction_loop === "yes";
    badges.push({
      icon: "🦻",
      label: hasLoop ? "Boucle magnétique disponible" : "Boucle magnétique : non renseignée",
      color: hasLoop ? "text-green-600" : "text-gray-400",
    });
  }

  // ── Handicap cognitif ──
  if (needs.includes("cognitive")) {
    badges.push({
      icon: "🧠",
      label: "Signalétique adaptée : non renseignée",
      color: "text-orange-500",
    });
  }

  // ── Toilettes adaptées (besoin spécifique) ──
  if (needs.includes("toilet") && !needs.includes("wheelchair")) {
    badges.push({
      icon: "🚻",
      label: toiletWc ? "Toilettes PMR disponibles" : "Toilettes PMR : non renseignées",
      color: toiletWc ? "text-green-600" : "text-gray-400",
    });
  }

  return badges;
}

export default function PlaceDetail({ place, typeLabel, needs, onClose }: PlaceDetailProps) {
  const wc = place.wheelchair || "unknown";
  const badges = getAccessibilityBadges(needs, place.tags, wc, place.toiletWheelchair);

  const isOpen = place.openingHours
    ? place.openingHours.toLowerCase().includes("24/7") ||
      place.openingHours.toLowerCase().includes("mo-su")
    : null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-6 max-h-[60%] overflow-y-auto">
      {/* Handle */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

      {/* Close */}
      <button onClick={onClose}
        className="absolute top-4 right-5 w-8 h-8 flex items-center justify-center text-gray-400"
        aria-label="Fermer">✕</button>

      {/* Type badge */}
      <span className="inline-block px-3 py-1 bg-red-50 text-primary text-xs font-semibold rounded-full mb-2">
        {typeLabel}
      </span>

      {/* Name */}
      <h2 className="text-lg font-bold text-gray-900 mb-1">{place.name}</h2>

      {/* Address */}
      <p className="text-sm text-gray-500 mb-3">{place.address}</p>

      {/* Opening hours */}
      {place.openingHours && (
        <p className="text-sm font-semibold mb-3">
          {isOpen !== null ? (
            <span className={isOpen ? "text-green-600" : "text-red-500"}>
              {isOpen ? "Ouvert maintenant" : "Fermé actuellement"}
            </span>
          ) : (
            <span className="text-gray-600">{place.openingHours}</span>
          )}
        </p>
      )}

      {/* Accessibility badges — un par besoin sélectionné */}
      {badges.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-lg w-6 text-center">{b.icon}</span>
              <span className={`text-sm font-medium ${b.color}`}>{b.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {place.website && (
          <a href={place.website} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center gap-1 px-3 py-2 border-2 border-primary rounded-2xl">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">+</div>
            <span className="text-xs font-semibold text-primary text-center">Réserver en ligne</span>
          </a>
        )}
        {place.phone && (
          <a href={`tel:${place.phone}`}
            className="flex-1 flex flex-col items-center gap-1 px-3 py-2 border-2 border-primary rounded-2xl">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">▶</div>
            <span className="text-xs font-semibold text-primary text-center">Appeler maintenant</span>
          </a>
        )}
        <a href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}&zoom=18`}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center gap-1 px-3 py-2 border-2 border-gray-200 rounded-2xl">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">🗺️</div>
          <span className="text-xs font-semibold text-gray-600 text-center">Voir sur la carte</span>
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Données OpenStreetMap — Pensez à vérifier les informations importantes.
      </p>
    </div>
  );
}
