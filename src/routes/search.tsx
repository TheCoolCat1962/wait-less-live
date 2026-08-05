import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Loader2, X } from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { BusinessCard } from "@/components/queueless/BusinessCard";
import { AutocompleteDropdown } from "@/components/queueless/AutocompleteDropdown";
import { distanceMiles, type BusinessWithWait } from "@/lib/queueless-data";
import { useLocation } from "@/lib/location";
import {
  fetchNearbyBusinesses,
  searchBusinessesByText,
  getAutocompleteSuggestions,
  getPlaceDetails,
  type AutocompleteSuggestion,
} from "@/lib/queueless.functions";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  const [raw, setRaw] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AutocompleteSuggestion | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { location } = useLocation();
  
  // Ref to track if user just selected a suggestion (to prevent debounce from clearing it)
  const justSelectedRef = useRef(false);

  // Track location version to detect changes and force query refetch
  // Use useEffect to avoid mutating state during render
  const locationVersionRef = useRef(0);
  const prevLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Use useEffect to detect when location actually changes (not just re-renders)
  // This avoids React Strict Mode double-render issues
  useEffect(() => {
    const currentCoords = location?.coords ?? null;
    const prevCoords = prevLocationRef.current;
    
    if (currentCoords && prevCoords) {
      if (currentCoords.lat !== prevCoords.lat || currentCoords.lng !== prevCoords.lng) {
        locationVersionRef.current++;
      }
    }
    prevLocationRef.current = currentCoords;
  }, [location?.coords.lat, location?.coords.lng]);

  // NOLA metro bounds (kept in sync with server). The nearby list is only
  // available in the launch region; name search stays available everywhere
  // (it returns NOLA-area results only, enforced server-side).
  const inNola = location
    ? location.coords.lat >= 29.82 &&
      location.coords.lat <= 30.15 &&
      location.coords.lng >= -90.35 &&
      location.coords.lng <= -89.55
    : true;

  // Debounce the query at 250ms for live autocomplete
  useEffect(() => {
    const t = setTimeout(() => {
      // Don't update if user just selected a suggestion
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      
      const trimmed = raw.trim();
      setQ(trimmed);
      // Show autocomplete when query is 3+ characters, but not if a suggestion was just selected
      setShowAutocomplete(trimmed.length >= 3);
    }, 250);
    return () => clearTimeout(t);
  }, [raw]);

  // Autocomplete query - enabled when 3+ chars and no selected suggestion
  const autocompleteQuery = useQuery({
    queryKey: ["autocomplete", q, location?.coords.lat, location?.coords.lng],
    enabled: q.length >= 3 && !selectedSuggestion && showAutocomplete,
    queryFn: () =>
      getAutocompleteSuggestions({
        data: {
          query: q,
          lat: location?.coords.lat,
          lng: location?.coords.lng,
        },
      }),
    staleTime: 60_000, // Cache autocomplete results longer
    gcTime: 5 * 60_000,
  });

  const nearbyQuery = useQuery({
    // Include location version in key to force refetch when location changes
    queryKey: ["nearby", location?.coords.lat, location?.coords.lng, locationVersionRef.current],
    enabled: !!location && inNola && q.length < 3,
    queryFn: () =>
      fetchNearbyBusinesses({
        data: {
          lat: location!.coords.lat,
          lng: location!.coords.lng,
          radiusMiles: 25,
        },
      }),
    staleTime: 60_000,
  });

  const textQuery = useQuery({
    queryKey: ["searchText", q, location?.coords.lat, location?.coords.lng],
    enabled: q.length >= 2,
    queryFn: () =>
      searchBusinessesByText({
        data: {
          query: q,
          lat: location?.coords.lat,
          lng: location?.coords.lng,
        },
      }),
    staleTime: 30_000,
  });

  // Determine which query to show
  const activeQuery = q.length >= 2 ? textQuery : nearbyQuery;
  
  // When autocomplete suggestion is selected, fetch that business
  const selectedBusinessQuery = useQuery({
    queryKey: ["selectedBusiness", selectedSuggestion?.placeId],
    enabled: !!selectedSuggestion,
    queryFn: async () => {
      if (!selectedSuggestion) return null;
      const details = await getPlaceDetails({ data: { placeId: selectedSuggestion.placeId } });
      // Navigate to the business page
      // We need to get the business ID from the database
      return details;
    },
  });

  // Navigate to selected business
  useEffect(() => {
    if (selectedSuggestion) {
      // Store the suggestion in session storage and navigate
      sessionStorage.setItem("selectedBusiness", JSON.stringify(selectedSuggestion));
      // The navigation will happen when user confirms selection
    }
  }, [selectedSuggestion]);

  // Build list of businesses to show
  const list: BusinessWithWait[] = useMemo(() => {
    if (activeQuery.data) {
      return activeQuery.data.map((b) => ({
        ...b,
        distanceMi: location
          ? distanceMiles(location.coords, { lat: b.lat, lng: b.lng })
          : undefined,
      }));
    }
    return [];
  }, [activeQuery.data, location]);

  // Intelligent ranking: exact > prefix > partial > nearby
  const rankedList = useMemo(() => {
    if (q.length < 3) return list;
    
    const queryLower = q.toLowerCase();
    
    return [...list].sort((a, b) => {
      const nameLowerA = a.name.toLowerCase();
      const nameLowerB = b.name.toLowerCase();
      
      // Exact match (highest priority)
      if (nameLowerA === queryLower && nameLowerB !== queryLower) return -1;
      if (nameLowerB === queryLower && nameLowerA !== queryLower) return 1;
      
      // Prefix match
      const aStartsWith = nameLowerA.startsWith(queryLower);
      const bStartsWith = nameLowerB.startsWith(queryLower);
      if (aStartsWith && !bStartsWith) return -1;
      if (bStartsWith && !aStartsWith) return 1;
      
      // Contains match (shorter names first)
      if (nameLowerA.includes(queryLower) && !nameLowerB.includes(queryLower)) return -1;
      if (nameLowerB.includes(queryLower) && !nameLowerA.includes(queryLower)) return 1;
      
      // Then by distance
      const distA = a.distanceMi ?? 999;
      const distB = b.distanceMi ?? 999;
      return distA - distB;
    });
  }, [list, q]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    list.forEach((b) => set.add(b.category));
    return ["All", ...Array.from(set).sort()];
  }, [list]);

  const filtered = useMemo(() => {
    return rankedList.filter((b) => (category === "All" ? true : b.category === category));
  }, [category, rankedList]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: AutocompleteSuggestion) => {
    // Mark that user just selected to prevent debounce from interfering
    justSelectedRef.current = true;
    
    setSelectedSuggestion(suggestion);
    setRaw(suggestion.mainText);
    setQ(suggestion.mainText);
    setShowAutocomplete(false);
    
    // Store suggestion in session storage for reference
    sessionStorage.setItem("searchSuggestion", JSON.stringify(suggestion));
  }, []);

  // Handle search submit (Enter key)
  const handleSearchSubmit = useCallback(() => {
    if (q.length >= 2) {
      setShowAutocomplete(false);
    }
  }, [q]);

  // Clear search
  const handleClear = useCallback(() => {
    setRaw("");
    setQ("");
    setShowAutocomplete(false);
    setSelectedSuggestion(null);
    inputRef.current?.focus();
  }, []);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowAutocomplete(false);
    } else if (e.key === "Enter") {
      setShowAutocomplete(false);
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);

  return (
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 pb-4 pt-6 backdrop-blur">
        <h1 className="mb-1 text-xl font-extrabold tracking-tight">Search</h1>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          New Orleans metro · more cities soon
        </p>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => raw.length >= 3 && setShowAutocomplete(true)}
            placeholder="Business name, category, or neighborhood…"
            className="w-full rounded-xl bg-surface-muted py-3 pl-10 pr-10 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {raw && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          
          {/* Autocomplete dropdown */}
          {showAutocomplete && (
            <div ref={dropdownRef}>
              <AutocompleteDropdown
                suggestions={autocompleteQuery.data ?? []}
                isLoading={autocompleteQuery.isLoading}
                onSelect={handleSelectSuggestion}
                onDismiss={() => setShowAutocomplete(false)}
                searchQuery={q}
              />
            </div>
          )}
        </div>
      </header>

      <div className="scrollbar-none flex gap-2 overflow-x-auto px-5 py-4">
        {categories.map((c) => {
          const active = c === category;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-surface text-foreground/70"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <main className="space-y-3 px-5 pb-6">
        {!location && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Set your location on the Home tab to search nearby.
          </p>
        )}
        
        {/* Show typing indicator when user is still typing */}
        {raw.length >= 3 && raw.length > q.length && (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <div className="size-3 animate-pulse rounded-full bg-brand" />
            <span>Keep typing...</span>
          </div>
        )}
        
        {activeQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {q.length >= 2 ? "Searching…" : "Loading nearby…"}
          </div>
        )}
        {activeQuery.isError && (
          <div className="rounded-2xl bg-danger/10 p-4 text-sm font-semibold text-danger">
            Couldn't run that search. {(activeQuery.error as Error)?.message}
          </div>
        )}
        {location &&
          !activeQuery.isLoading &&
          !activeQuery.isError &&
          (filtered.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              {q.length >= 2
                ? `No New Orleans-area places match "${q}".`
                : !inNola
                  ? "QueueLess is currently available only in the New Orleans metro area. Search by name to find places in the metro."
                  : "No places nearby yet."}
            </p>
          ) : (
            <>
              {q.length >= 3 && (
                <p className="text-xs font-medium text-muted-foreground">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{q}"
                </p>
              )}
              {filtered.map((b) => <BusinessCard key={b.id} business={b} />)}
            </>
          ))}
      </main>
    </AppShell>
  );
}
