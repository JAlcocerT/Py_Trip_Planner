"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Result {
  display_name: string;
  lat: number;
  lon: number;
}

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number) => void;
  className?: string;
}

export default function LocationSearch({
  onLocationSelect,
  className,
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((data: Result[]) => {
          setResults(data);
          setOpen(data.length > 0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleSelect(result: Result) {
    onLocationSelect(result.lat, result.lon);
    setQuery("");
    setOpen(false);
    setResults([]);
  }

  // Shorten display name for readability
  function shortName(name: string) {
    const parts = name.split(", ");
    return parts.length > 3 ? parts.slice(0, 3).join(", ") + "…" : name;
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
        {loading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            …
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md py-1 text-sm max-h-56 overflow-auto">
          {results.map((r, i) => (
            <li
              key={i}
              className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur before click fires
                handleSelect(r);
              }}
            >
              {shortName(r.display_name)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
