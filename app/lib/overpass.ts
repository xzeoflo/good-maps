import { AccessiblePlace } from "../types";

const NOMINATIM = "https://nominatim.openstreetmap.org";

export const CATEGORIES = [
  { id: "all",         label: "Tout",        icon: "🗺️", amenity: null,         shop: null,          tourism: null },
  { id: "restaurant",  label: "Restos",      icon: "🍽️", amenity: "restaurant", shop: null,          tourism: null },
  { id: "cafe",        label: "Cafés",       icon: "☕",  amenity: "cafe",       shop: null,          tourism: null },
  { id: "bar",         label: "Bars",        icon: "🍺",  amenity: "bar",        shop: null,          tourism: null },
  { id: "hotel",       label: "Hôtels",      icon: "🏨",  amenity: null,         shop: null,          tourism: "hotel" },
  { id: "museum",      label: "Musées",      icon: "🏛️", amenity: null,         shop: null,          tourism: "museum" },
  { id: "cinema",      label: "Cinémas",     icon: "🎬",  amenity: "cinema",     shop: null,          tourism: null },
  { id: "theatre",     label: "Théâtres",    icon: "🎭",  amenity: "theatre",    shop: null,          tourism: null },
  { id: "pharmacy",    label: "Pharmacies",  icon: "💊",  amenity: "pharmacy",   shop: null,          tourism: null },
  { id: "toilets",     label: "Toilettes",   icon: "🚻",  amenity: "toilets",    shop: null,          tourism: null },
  { id: "supermarket", label: "Supermarchés",icon: "🛒",  amenity: null,         shop: "supermarket", tourism: null },
  { id: "hospital",    label: "Hôpitaux",    icon: "🏥",  amenity: "hospital",   shop: null,          tourism: null },
] as const;

export type CategoryId = typeof CATEGORIES[number]["id"];

// Convertit lat/lon + rayon en viewbox Nominatim (west,north,east,south)
function toViewbox(lat: number, lon: number, radiusM = 1500): string {
  const dLat = radiusM / 111320;
  const dLon = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  return `${lon - dLon},${lat + dLat},${lon + dLon},${lat - dLat}`;
}

interface NominatimResult {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  type: string;
  category: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
}

function parseResult(r: NominatimResult): AccessiblePlace | null {
  if (!r.name) return null;

  const ext = r.extratags || {};
  const addr = r.address || {};

  const street  = [addr.house_number, addr.road].filter(Boolean).join(" ");
  const city    = addr.city || addr.town || addr.village || addr.municipality || "";
  const address = [street, city].filter(Boolean).join(", ") || r.display_name.split(",").slice(1, 3).join(",").trim();

  const wheelchair = (ext.wheelchair || ext["wheelchair:description"]
    ? ext.wheelchair || "unknown"
    : "unknown") as AccessiblePlace["wheelchair"];

  return {
    id: `${r.osm_type}/${r.osm_id}`,
    name: r.name,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    address,
    wheelchair,
    toiletWheelchair: ext["toilets:wheelchair"] === "yes",
    openingHours: ext.opening_hours,
    phone: ext.phone || ext["contact:phone"],
    website: ext.website || ext["contact:website"],
    type: r.type || r.category || "lieu",
    tags: ext,
  };
}

async function searchNominatim(
  params: Record<string, string>
): Promise<NominatimResult[]> {
  const qs = new URLSearchParams({
    format: "jsonv2",
    limit: "60",
    bounded: "1",
    extratags: "1",
    addressdetails: "1",
    ...params,
  });

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`${NOMINATIM}/search.php?${qs}`, {
      headers: { "User-Agent": "GoodMaps/1.0 (accessibility map app)" },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    clearTimeout(t);
    return [];
  }
}

export async function fetchAccessiblePlaces(
  lat: number,
  lon: number,
  needs: string[],
  categoryId: CategoryId = "all"
): Promise<AccessiblePlace[]> {
  const viewbox = toViewbox(lat, lon, 1500);
  const cat = CATEGORIES.find((c) => c.id === categoryId);

  let results: NominatimResult[] = [];

  if (!cat || (!cat.amenity && !cat.shop && !cat.tourism)) {
    // "Tout" : cherche les types les plus courants en parallèle
    const searches = await Promise.all([
      searchNominatim({ amenity: "restaurant", viewbox }),
      searchNominatim({ amenity: "cafe",       viewbox }),
      searchNominatim({ amenity: "bar",        viewbox }),
      searchNominatim({ tourism: "hotel",      viewbox }),
      searchNominatim({ amenity: "museum",     viewbox }),
    ]);
    results = searches.flat();
  } else if (cat.amenity) {
    results = await searchNominatim({ amenity: cat.amenity, viewbox });
  } else if (cat.shop) {
    results = await searchNominatim({ ["shop"]: cat.shop, viewbox });
  } else if (cat.tourism) {
    results = await searchNominatim({ tourism: cat.tourism, viewbox });
  }

  // Parser et dédoublonner
  const seen = new Set<string>();
  const places: AccessiblePlace[] = [];
  for (const r of results) {
    const p = parseResult(r);
    if (!p) continue;
    const key = `${p.name}-${p.lat.toFixed(4)}-${p.lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    places.push(p);
  }

  // Trier par accessibilité si fauteuil roulant
  if (needs.includes("wheelchair") || needs.includes("motor")) {
    const score: Record<string, number> = { yes: 3, limited: 2, unknown: 1, no: 0 };
    places.sort((a, b) => (score[b.wheelchair] ?? 1) - (score[a.wheelchair] ?? 1));
  }

  return places;
}
