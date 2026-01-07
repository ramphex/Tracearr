import { useEffect } from 'react';
import { Link } from 'react-router';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ActiveSession, LocationStats } from '@tracearr/shared';
import { cn, getCountryName } from '@/lib/utils';
import { ActiveSessionBadge } from '@/components/sessions/ActiveSessionBadge';
import { useTheme } from '@/components/theme-provider';
import { User, MapPin } from 'lucide-react';
import { getAvatarUrl } from '@/components/users/utils';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icon for active sessions
const activeSessionIcon = L.divIcon({
  className: 'stream-marker',
  html: `<div class="relative">
    <div class="absolute -inset-1 animate-ping rounded-full bg-green-500/50"></div>
    <div class="relative h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow-lg"></div>
  </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

// Location marker icon
const locationIcon = L.divIcon({
  className: 'location-marker',
  html: `<div class="h-3 w-3 rounded-full bg-blue-500 border-2 border-white shadow-md"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -8],
});

// Format media title based on type
function formatMediaTitle(session: ActiveSession): { primary: string; secondary: string | null } {
  const { mediaType, mediaTitle, grandparentTitle, seasonNumber, episodeNumber, year } = session;

  if (mediaType === 'episode' && grandparentTitle) {
    const seasonEp =
      seasonNumber && episodeNumber
        ? `S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`
        : null;
    return {
      primary: grandparentTitle,
      secondary: seasonEp ? `${seasonEp} · ${mediaTitle}` : mediaTitle,
    };
  }

  if (mediaType === 'movie') {
    return { primary: mediaTitle, secondary: year ? `${year}` : null };
  }

  return { primary: mediaTitle, secondary: null };
}

// Custom styles for popup and z-index fixes
const popupStyles = `
  /* Ensure map container doesn't overlap sidebars/modals */
  .leaflet-container {
    z-index: 0 !important;
  }
  .leaflet-pane {
    z-index: 1 !important;
  }
  .leaflet-tile-pane {
    z-index: 1 !important;
  }
  .leaflet-overlay-pane {
    z-index: 2 !important;
  }
  .leaflet-marker-pane {
    z-index: 3 !important;
  }
  .leaflet-tooltip-pane {
    z-index: 4 !important;
  }
  .leaflet-popup-pane {
    z-index: 5 !important;
  }
  .leaflet-control {
    z-index: 10 !important;
  }
  .leaflet-popup-content-wrapper {
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    padding: 0;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    min-width: 220px;
    max-width: 280px;
  }
  .leaflet-popup-tip {
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-top: none;
    border-right: none;
  }
  .leaflet-popup-close-button {
    color: hsl(var(--muted-foreground)) !important;
    font-size: 18px !important;
    padding: 4px 8px !important;
  }
  .leaflet-popup-close-button:hover {
    color: hsl(var(--foreground)) !important;
  }
`;

interface StreamCardProps {
  sessions?: ActiveSession[];
  locations?: LocationStats[];
  className?: string;
  height?: number | string;
}

interface DisplayPoint {
  lat: number;
  lon: number;
}

// Component to fit bounds when data changes
function MapBoundsUpdater({
  sessionPoints,
  locationPoints,
}: {
  sessionPoints?: DisplayPoint[];
  locationPoints?: DisplayPoint[];
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    sessionPoints?.forEach((p) => points.push([p.lat, p.lon]));
    locationPoints?.forEach((p) => points.push([p.lat, p.lon]));

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [sessionPoints, locationPoints, map]);

  return null;
}

// Map tile URLs for different themes
const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

// Deterministic pseudo-random generator for stable jitter
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: string, min: number, max: number) {
  const h = hashString(seed);
  const x = Math.sin(h) * 10000;
  const fraction = x - Math.floor(x);
  return min + fraction * (max - min);
}

// Smiley face offsets around a center point (lat, lon)
const SMILEY_OFFSETS: DisplayPoint[] = [
  { lat: 8, lon: -12 }, // left eye
  { lat: 8, lon: 12 }, // right eye
  { lat: -2, lon: -12 }, // mouth start
  { lat: -6, lon: -6 },
  { lat: -8, lon: -2 },
  { lat: -8, lon: 2 },
  { lat: -6, lon: 6 },
  { lat: -2, lon: 12 }, // mouth end
  { lat: 0, lon: 0 }, // nose/center
];

function getPrivacyPosition(seed: string, index: number): DisplayPoint {
  const base = { lat: 20, lon: 0 };

  if (index < SMILEY_OFFSETS.length) {
    return {
      lat: base.lat + SMILEY_OFFSETS[index]!.lat,
      lon: base.lon + SMILEY_OFFSETS[index]!.lon,
    };
  }

  // Spread jittered points around the center for overflow
  const latOffset = seededRandom(`${seed}-lat-${index}`, -25, 25);
  const lonOffset = seededRandom(`${seed}-lon-${index}`, -40, 40);

  return { lat: base.lat + latOffset, lon: base.lon + lonOffset };
}

// Obfuscate text deterministically for privacy mode
function scrambleText(text: string): string {
  const baseSeed = text.length || 1;
  return text
    .split('')
    .map((char, index) => {
      if (/[a-zA-Z]/.test(char)) {
        const isUpper = char === char.toUpperCase();
        const offset = (char.toLowerCase().charCodeAt(0) - 97 + baseSeed + index * 7) % 26;
        const scrambled = String.fromCharCode(97 + offset);
        return isUpper ? scrambled.toUpperCase() : scrambled;
      }
      if (/[0-9]/.test(char)) {
        return String((parseInt(char, 10) + baseSeed + index) % 10);
      }
      return char;
    })
    .join('');
}

export function StreamCard({ sessions, locations, className, height = 300 }: StreamCardProps) {
  const { theme, privacyMode } = useTheme();
  const hasData =
    sessions?.some((s) => s.geoLat && s.geoLon) || locations?.some((l) => l.lat && l.lon);
  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  const tileUrl = TILE_URLS[resolvedTheme];

  const sessionPointMap = new Map<string, DisplayPoint>();
  sessions?.forEach((session, index) => {
    if (session.geoLat == null || session.geoLon == null) return;

    if (privacyMode) {
      sessionPointMap.set(session.id, getPrivacyPosition(`session-${session.id}`, index));
    } else {
      sessionPointMap.set(session.id, { lat: session.geoLat, lon: session.geoLon });
    }
  });

  const locationPointMap = new Map<string, DisplayPoint>();
  locations?.forEach((location, index) => {
    if (location.lat == null || location.lon == null) return;

    const key = `${location.city}-${location.country}-${index}`;
    if (privacyMode) {
      locationPointMap.set(
        key,
        getPrivacyPosition(`location-${location.city}-${location.country}`, index)
      );
    } else {
      locationPointMap.set(key, { lat: location.lat, lon: location.lon });
    }
  });

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)} style={{ height }}>
      <style>{popupStyles}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          key={resolvedTheme}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />

        <MapBoundsUpdater
          sessionPoints={Array.from(sessionPointMap.values())}
          locationPoints={Array.from(locationPointMap.values())}
        />

        {/* Active session markers */}
        {sessions?.map((session) => {
          if (session.geoLat == null || session.geoLon == null) return null;

          const basePoint = { lat: session.geoLat, lon: session.geoLon };
          const displayPoint = privacyMode
            ? (sessionPointMap.get(session.id) ?? basePoint)
            : basePoint;

          const avatarUrl = getAvatarUrl(session.serverId, session.user.thumbUrl, 32);
          const { primary: mediaTitle, secondary: mediaSubtitle } = formatMediaTitle(session);
          const displayUserName = privacyMode
            ? scrambleText(session.user.identityName ?? session.user.username)
            : (session.user.identityName ?? session.user.username);
          const displayLocation = privacyMode
            ? scrambleText(session.geoCity || getCountryName(session.geoCountry) || 'Unknown')
            : session.geoCity || getCountryName(session.geoCountry);

          return (
            <Marker
              key={session.id}
              position={[displayPoint.lat, displayPoint.lon]}
              icon={activeSessionIcon}
            >
              <Popup>
                <div className="text-foreground min-w-[180px] p-2.5">
                  {/* Media title */}
                  <h4 className="text-sm leading-snug font-semibold">{mediaTitle}</h4>

                  {/* Subtitle + status on same line */}
                  <div className="mt-0.5 flex items-center gap-2">
                    {mediaSubtitle && (
                      <span className="text-muted-foreground truncate text-xs">
                        {mediaSubtitle}
                      </span>
                    )}
                    <ActiveSessionBadge state={session.state} className="px-1.5 py-0 text-[10px]" />
                  </div>

                  {/* User - clickable */}
                  <Link
                    to={`/users/${session.user.id}`}
                    className={cn(
                      'mt-2 flex items-center gap-2 py-1 transition-opacity hover:opacity-80',
                      privacyMode && 'pointer-events-none'
                    )}
                  >
                    <div
                      className={cn(
                        'bg-muted flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full',
                        privacyMode && 'blur-[2px]'
                      )}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={session.user.username}
                          className="h-5 w-5 object-cover"
                        />
                      ) : (
                        <User className="text-muted-foreground h-3 w-3" />
                      )}
                    </div>
                    <span
                      className={cn('text-xs font-medium', privacyMode && 'blur-[2px] select-none')}
                    >
                      {displayUserName}
                    </span>
                  </Link>

                  {/* Meta info */}
                  <div className="text-muted-foreground mt-1 flex items-center gap-2 text-[11px]">
                    {(session.geoCity || session.geoCountry) && (
                      <>
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className={cn('truncate', privacyMode && 'blur-[2px] select-none')}>
                          {displayLocation}
                        </span>
                      </>
                    )}
                    {(session.product || session.platform) && (
                      <>
                        <span className="text-border">·</span>
                        <span className="truncate">{session.product || session.platform}</span>
                      </>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Location stats markers */}
        {locations?.map((location, idx) => {
          if (location.lat == null || location.lon == null) return null;

          const key = `${location.city}-${location.country}-${idx}`;
          const basePoint = { lat: location.lat, lon: location.lon };
          const displayPoint = privacyMode ? (locationPointMap.get(key) ?? basePoint) : basePoint;
          const displayCity = privacyMode
            ? scrambleText(location.city || 'Unknown')
            : location.city || 'Unknown';
          const displayCountry = privacyMode
            ? scrambleText(location.country || '')
            : location.country;

          return (
            <Marker
              key={`${location.city}-${location.country}-${idx}`}
              position={[displayPoint.lat, displayPoint.lon]}
              icon={locationIcon}
            >
              <Popup>
                <div className="text-foreground p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className={cn('font-semibold', privacyMode && 'blur-[2px] select-none')}>
                        {displayCity}
                      </p>
                      <p
                        className={cn(
                          'text-muted-foreground text-xs',
                          privacyMode && 'blur-[2px] select-none'
                        )}
                      >
                        {displayCountry}
                      </p>
                    </div>
                  </div>
                  <div className="border-border mt-2 flex items-center justify-between border-t pt-2 text-sm">
                    <span className="text-muted-foreground">Total streams</span>
                    <span className="font-medium">{location.count}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {!hasData && (
        <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No location data available</p>
        </div>
      )}
    </div>
  );
}
