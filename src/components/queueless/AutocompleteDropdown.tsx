import { memo } from "react";
import { MapPin, Building2, Search } from "lucide-react";
import type { AutocompleteSuggestion } from "@/lib/queueless.functions";

interface AutocompleteDropdownProps {
  suggestions: AutocompleteSuggestion[];
  isLoading: boolean;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  onDismiss: () => void;
  searchQuery: string;
}

export const AutocompleteDropdown = memo(function AutocompleteDropdown({
  suggestions,
  isLoading,
  onSelect,
  onDismiss,
  searchQuery,
}: AutocompleteDropdownProps) {
  // Don't render if no suggestions and not loading
  if (!isLoading && suggestions.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
        <div className="flex items-center gap-3 px-4 py-4 text-sm text-muted-foreground">
          <Search className="size-4 shrink-0" />
          <span>No businesses found for "{searchQuery}"</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
      {isLoading && suggestions.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4 text-sm text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <span>Searching...</span>
        </div>
      ) : (
        <ul className="max-h-96 overflow-y-auto py-2">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                onClick={() => onSelect(suggestion)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted focus:bg-surface-muted focus:outline-none"
              >
                <div className="mt-0.5 shrink-0">
                  {suggestion.types.includes("restaurant") ||
                  suggestion.types.includes("food") ? (
                    <Building2 className="size-5 text-brand" />
                  ) : (
                    <MapPin className="size-5 text-brand" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <HighlightedText
                    text={suggestion.mainText}
                    query={searchQuery}
                    className="font-semibold text-foreground"
                  />
                  {suggestion.secondaryText && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {suggestion.secondaryText}
                    </p>
                  )}
                  {suggestion.types[0] && (
                    <span className="mt-1 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {formatType(suggestion.types[0])}
                    </span>
                  )}
                </div>
              </button>
              {index < suggestions.length - 1 && (
                <div className="mx-4 border-b border-border" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

// Highlight matched substrings in text
function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  if (!query) {
    return <span className={className}>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;

  // Find all occurrences of the query
  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    // Add highlighted match
    parts.push(
      <mark key={index} className="bg-brand/20 text-brand">
        {text.slice(index, index + query.length)}
      </mark>
    );
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}

// Format type for display
function formatType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
