export type PlaceSuggestion = {
  id: string;
  label: string;
  sublabel: string;
  lngLat: [number, number];
};

type PhotonFeature = {
  properties: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    street?: string;
    city?: string;
    district?: string;
    locality?: string;
    state?: string;
  };
  geometry: { coordinates: [number, number] };
};

type PhotonResponse = { features: PhotonFeature[] };

// Photon (photon.komoot.io): geocoder gratis basado en OSM, con soporte real de
// autocompletado (a diferencia de expo-location, que solo da coordenadas sin nombre)
// y bias por cercanía vía lat/lon — ideal para "sugerencias ordenadas por cercanía".
// TODO: si el volumen escala mucho, self-hostear (mismo criterio que el resto de
// servicios OSM del proyecto — ver MAP_STYLE en reports-map.tsx).
export async function searchPlaces(
  query: string,
  near: [number, number] | null,
  limit = 5
): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (near) {
    params.set('lon', String(near[0]));
    params.set('lat', String(near[1]));
  }

  const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
  if (!response.ok) return [];
  const data = (await response.json()) as PhotonResponse;

  return data.features.map((feature, index) => {
    const p = feature.properties;
    const sublabel = [p.street, p.city ?? p.district ?? p.locality, p.state]
      .filter(Boolean)
      .join(', ');
    return {
      id: `${p.osm_type ?? 'x'}-${p.osm_id ?? index}-${index}`,
      label: p.name ?? p.street ?? 'Ubicación',
      sublabel,
      lngLat: feature.geometry.coordinates,
    };
  });
}
