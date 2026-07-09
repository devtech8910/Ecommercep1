import React, { useState, useEffect, useRef } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import type { LocationEntity } from '../services/locationService';

interface AutocompleteInputProps {
  label: string;
  placeholder: string;
  value: string;
  disabled?: boolean;
  error?: string;
  registerProps: UseFormRegisterReturn;
  onChange: (value: string) => void;
  onSelect: (entity: LocationEntity) => void;
  fetchSuggestions: (query: string, signal: AbortSignal) => Promise<LocationEntity[]>;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  placeholder,
  value,
  disabled = false,
  error,
  registerProps,
  onChange,
  onSelect,
  fetchSuggestions
}) => {
  const [suggestions, setSuggestions] = useState<LocationEntity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSelectedValue, setLastSelectedValue] = useState(value);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external value changes (e.g. resets)
  useEffect(() => {
    setLastSelectedValue(value);
  }, [value]);

  // Close dropdown on outside click and enforce selection rule
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Allow Free-Text: If user typed custom text and didn't select, accept it.
        if (value && value !== lastSelectedValue) {
          setLastSelectedValue(value);
          // Pass a fallback entity so dependent fields unlock
          onSelect({ id: Date.now(), name: value, lat: 0, lng: 0 });
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, lastSelectedValue, onChange]);

  const loadSuggestions = async (query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setHasSearched(true);
    try {
      const results = await fetchSuggestions(query, abortControllerRef.current.signal);
      setSuggestions(results);
      setIsOpen(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch suggestions:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    if (disabled) return;
    if (!value || value.length === 0) {
      loadSuggestions('');
    } else {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    registerProps.onChange(e);
    onChange(val);

    if (val.length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      loadSuggestions(val);
    }, 300); // 300ms debounce
  };

  const handleSelect = (suggestion: LocationEntity) => {
    setLastSelectedValue(suggestion.name);
    onChange(suggestion.name);
    onSelect(suggestion);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="text"
        {...registerProps}
        value={value || ''}
        onChange={handleInputChange}
        onFocus={handleFocus}
        disabled={disabled}
        className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-black/30 outline-none transition-all 
          ${disabled ? 'bg-black/10 cursor-not-allowed opacity-60' : 'bg-black/5 focus:border-indigo-600 focus:bg-white'}
          ${error ? 'border-red-500/50 bg-red-500/5' : 'border-black/10'}`}
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-10 text-[10px] text-indigo-600 animate-pulse">
          Searching...
        </span>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && !disabled && (
        <ul className="absolute z-[1000] mt-1 w-full bg-white border border-black/10 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-black/5 text-sm">
          {!loading && hasSearched && suggestions.length === 0 && (
             <li className="px-4 py-4 text-slate-500 text-center italic">
                No locations found in the selected region.
             </li>
          )}
          {loading && suggestions.length === 0 && (
             <li className="px-4 py-4 text-slate-400 text-center animate-pulse">
                Loading...
             </li>
          )}
          {suggestions.map((s) => (
              <li
                key={s.id}
                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                onClick={() => handleSelect(s)}
              >
                <div className="font-semibold text-slate-800 truncate">
                  {s.name}
                </div>
                {(s.code || s.pincode) && (
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {s.code ? `${s.code}` : `PIN: ${s.pincode}`}
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};
