"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { AccessiblePlace } from "../types";
import { fetchAccessiblePlaces, CATEGORIES, CategoryId } from "../lib/overpass";
import PlaceDetail from "./PlaceDetail";
import GoodMapsLogo from "./GoodMapsLogo";

interface MapViewProps {
  needs: string[];
  initialCity?: string;
  onBack: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant", cafe: "Café", bar: "Bar", fast_food: "Fast-food",
  museum: "Musée", theatre: "Théâtre", cinema: "Cinéma", hotel: "Hôtel",
  toilets: "Toilettes", pharmacy: "Pharmacie", hospital: "Hôpital",
  bank: "Banque", supermarket: "Supermarché", lieu: "Lieu",
};

export default function MapView({ needs, initialCity, onBack }: MapViewProps) {
  const mapRef        = useRef<LeafletMap | null>(null);
  const mapDivRef     = useRef<HTMLDivElement>(null);
  const markersRef    = useRef<unknown[]>([]);
  const lastPosRef    = useRef<[number, number] | null>(null);

  const [isMapReady, setIsMapReady]     = useState(false);
  const [places, setPlaces]             = useState<AccessiblePlace[]>([]);
  const [selected, setSelected]         = useState<AccessiblePlace | null>(null);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [category, setCategory]         = useState<CategoryId>("all");

  // ── 1. Init Leaflet (client-only) ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !mapDivRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((mapDivRef.current as any)._leaflet_id || mapRef.current) return;

    import("leaflet").then((L) => {
      if (!mapDivRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapDivRef.current as any)._leaflet_id) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapDivRef.current, {
        center: [48.8566, 2.3522],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
      setIsMapReady(true); // ← signal React que la carte est prête
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── 2. Marqueurs : se déclenche quand places OU isMapReady change ─────────
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    import("leaflet").then((L) => {
      // Nettoyer anciens marqueurs
      markersRef.current.forEach((m) => (m as { remove: () => void }).remove());
      markersRef.current = [];

      function makeIcon(color: string) {
        return L.divIcon({
          className: "",
          html: `<svg width="28" height="38" viewBox="0 0 28 38" fill="none">
            <path d="M14 0C6.268 0 0 6.268 0 14C0 24 14 38 14 38C14 38 28 24 28 14C28 6.268 21.732 0 14 0Z" fill="${color}"/>
            <circle cx="14" cy="14" r="6" fill="white"/>
            <circle cx="14" cy="14" r="3" fill="${color}"/>
          </svg>`,
          iconSize: [28, 38],
          iconAnchor: [14, 38],
        });
      }

      function markerColor(place: AccessiblePlace): string {
        let satisfied = 0;
        let total = 0;

        if (needs.includes("wheelchair") || needs.includes("motor")) {
          total++;
          if (place.wheelchair === "yes") satisfied++;
          else if (place.wheelchair === "limited") satisfied += 0.5;
        }
        if (needs.includes("toilet")) {
          total++;
          if (place.toiletWheelchair) satisfied++;
        }
        if (needs.includes("blind")) {
          total++;
          if (place.tags.tactile_paving === "yes" || place.tags.speech_output === "yes") satisfied++;
        }
        if (needs.includes("deaf")) {
          total++;
          if (place.tags.hearing_loop === "yes" || place.tags.induction_loop === "yes") satisfied++;
        }
        if (needs.includes("cognitive")) {
          total++;
          // Rarement tagué → ne compte jamais comme satisfait
        }

        if (total === 0) return "#E8554A";        // aucun besoin → rouge par défaut
        const ratio = satisfied / total;
        if (ratio >= 1)   return "#22c55e";       // tout satisfait → vert
        if (ratio >= 0.5) return "#f97316";       // moitié → orange
        return "#6b7280";                          // rien ou presque → gris
      }

      places.forEach((place) => {
        const icon = makeIcon(markerColor(place));
        const marker = L.marker([place.lat, place.lon], { icon })
          .addTo(mapRef.current!)
          .on("click", () => setSelected(place));
        markersRef.current.push(marker);
      });
    });
  }, [places, isMapReady]); // ← les deux dépendances

  // ── 3. Charger les lieux ──────────────────────────────────────────────────
  const loadPlaces = useCallback(async (lat: number, lon: number, cat?: CategoryId) => {
    setLoading(true);
    lastPosRef.current = [lat, lon];
    const activeCat = cat ?? category;
    try {
      const results = await fetchAccessiblePlaces(lat, lon, needs, activeCat);
      setPlaces(results);
      if (mapRef.current) mapRef.current.setView([lat, lon], 15);
    } catch {
      alert("Impossible de charger les lieux.\nVérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }, [needs, category]);

  // ── 4. Auto-load ville initiale (après que la carte soit prête) ───────────
  const initialCityLoadedRef = useRef(false);
  useEffect(() => {
    if (!isMapReady || !initialCity || initialCityLoadedRef.current) return;
    initialCityLoadedRef.current = true;
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(initialCity)}&format=json&limit=1`,
      { headers: { "Accept-Language": "fr", "User-Agent": "GoodMaps/1.0" } }
    )
      .then((r) => r.json())
      .then((data) => { if (data.length) loadPlaces(parseFloat(data[0].lat), parseFloat(data[0].lon)); })
      .catch(() => {});
  }, [isMapReady, initialCity, loadPlaces]);

  // ── 5. Handlers ───────────────────────────────────────────────────────────
  function handleCategoryChange(newCat: CategoryId) {
    setCategory(newCat);
    setSelected(null);
    if (lastPosRef.current) loadPlaces(lastPosRef.current[0], lastPosRef.current[1], newCat);
  }

  async function geocodeCity(q: string): Promise<[number, number] | null> {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { "Accept-Language": "fr", "User-Agent": "GoodMaps/1.0" } }
      );
      const d = await r.json();
      if (d.length) return [parseFloat(d[0].lat), parseFloat(d[0].lon)];
    } catch {/* */}
    return null;
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    setSearchLoading(true);
    try {
      const coords = await geocodeCity(q);
      if (!coords) { alert(`Adresse introuvable : "${q}"`); return; }
      await loadPlaces(coords[0], coords[1]);
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleGetSuggestions() {
    const fromSearch  = search.trim();
    const fromProfile = initialCity?.trim();

    // Priorité 1 : barre de recherche
    if (fromSearch) {
      const coords = await geocodeCity(fromSearch);
      if (coords) { loadPlaces(coords[0], coords[1]); return; }
      alert(`Ville "${fromSearch}" introuvable.`);
      return;
    }
    // Priorité 2 : ville du profil
    if (fromProfile) {
      const coords = await geocodeCity(fromProfile);
      if (coords) { loadPlaces(coords[0], coords[1]); return; }
    }
    // Priorité 3 : géolocalisation
    if (!navigator.geolocation) { loadPlaces(48.8566, 2.3522); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        import("leaflet").then((L) => {
          if (!mapRef.current) return;
          L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: "",
              html: `<div style="width:16px;height:16px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
              iconSize: [16, 16], iconAnchor: [8, 8],
            }),
          }).addTo(mapRef.current);
        });
        loadPlaces(latitude, longitude);
      },
      () => loadPlaces(48.8566, 2.3522)
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-8 pb-3 bg-white shadow-sm z-10 relative">
        <button onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 active:scale-95 transition-all"
          aria-label="Retour">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <GoodMapsLogo size="sm" />
        <div className="w-10 h-10" />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="anonymous" />
        <div ref={mapDivRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Recherche des lieux accessibles...</p>
            </div>
          </div>
        )}
      </div>

      {/* Category chips */}
      <div className="bg-white pt-3 pb-1 px-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button key={cat.id}
                onClick={() => handleCategoryChange(cat.id as CategoryId)}
                className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all border-2 ${
                  active ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200"}`}>
                <span>{cat.icon}</span><span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white px-4 pb-2 flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Accessible</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />Partiel</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#E8554A] inline-block" />Non renseigné</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />Non accessible</span>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-3 pb-1 bg-white">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 h-11">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder='Ex : "Lille", "Lyon 69001"...'
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400" />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-gray-400 text-lg leading-none">✕</button>
            )}
          </div>
          <button type="submit" disabled={searchLoading || !search.trim()}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 flex-shrink-0 active:scale-95 transition-all"
            aria-label="Rechercher">
            {searchLoading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
                </svg>
            }
          </button>
        </form>
      </div>

      {/* CTA */}
      <div className="px-4 pt-2 pb-3 bg-white">
        <button onClick={handleGetSuggestions} disabled={loading}
          className="w-full h-12 rounded-full bg-primary text-white font-bold text-sm tracking-wide disabled:opacity-50 active:scale-95 transition-all">
          {loading ? "Recherche en cours..." : "Obtenir des suggestions"}
        </button>
      </div>

      {selected && (
        <PlaceDetail
          place={selected}
          typeLabel={TYPE_LABELS[selected.type] || selected.type}
          needs={needs}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
