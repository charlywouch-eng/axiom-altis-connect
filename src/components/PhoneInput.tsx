import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export interface CountryCode {
  flag: string;
  name: string;
  code: string;
  pattern: RegExp;
  placeholder: string;
}

export const FRANCOPHONE_COUNTRIES: CountryCode[] = [
  { flag: "🇨🇲", name: "Cameroun",       code: "+237", pattern: /^6\d{8}$/,     placeholder: "6XX XXX XXX" },
  { flag: "🇸🇳", name: "Sénégal",        code: "+221", pattern: /^7[0-9]\d{7}$/, placeholder: "7X XXX XX XX" },
  { flag: "🇨🇮", name: "Côte d'Ivoire",  code: "+225", pattern: /^[0-9]\d{9}$/,  placeholder: "XX XX XXX XXX" },
  { flag: "🇲🇱", name: "Mali",           code: "+223", pattern: /^[5-9]\d{7}$/,  placeholder: "XX XX XX XX" },
  { flag: "🇧🇫", name: "Burkina Faso",   code: "+226", pattern: /^[5-7]\d{7}$/,  placeholder: "XX XX XX XX" },
  { flag: "🇬🇳", name: "Guinée",         code: "+224", pattern: /^6\d{8}$/,      placeholder: "6XX XXX XXX" },
  { flag: "🇧🇯", name: "Bénin",          code: "+229", pattern: /^\d{8}$/,       placeholder: "XX XX XX XX" },
  { flag: "🇹🇬", name: "Togo",           code: "+228", pattern: /^[9]\d{7}$/,    placeholder: "9X XX XX XX" },
  { flag: "🇳🇪", name: "Niger",          code: "+227", pattern: /^[89]\d{7}$/,   placeholder: "XX XX XX XX" },
  { flag: "🇹🇩", name: "Tchad",          code: "+235", pattern: /^[6-9]\d{7}$/,  placeholder: "XX XX XX XX" },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullValue: string, isValid: boolean) => void;
  className?: string;
}

export function PhoneInput({ value, onChange, className = "" }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(FRANCOPHONE_COUNTRIES[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse initial value to detect country code
  useEffect(() => {
    if (value) {
      const match = FRANCOPHONE_COUNTRIES.find((c) => value.startsWith(c.code));
      if (match) setSelectedCountry(match);
    }
  }, []);

  const rawNumber = value.replace(/^\+\d{2,3}\s?/, "").replace(/\s/g, "");
  const isValid = selectedCountry.pattern.test(rawNumber);

  const handleNumberChange = (num: string) => {
    const cleaned = num.replace(/[^\d]/g, "");
    const full = `${selectedCountry.code} ${cleaned}`;
    onChange(full, selectedCountry.pattern.test(cleaned));
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setOpen(false);
    const full = `${country.code} ${rawNumber}`;
    onChange(full, country.pattern.test(rawNumber));
    inputRef.current?.focus();
  };

  return (
    <div className={`flex gap-1.5 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-12 px-2.5 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 shrink-0 gap-1"
          >
            <span className="text-lg leading-none">{selectedCountry.flag}</span>
            <span className="text-xs font-mono text-white/60">{selectedCountry.code}</span>
            <ChevronDown className="h-3 w-3 text-white/40" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1 rounded-xl" align="start">
          {FRANCOPHONE_COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleCountrySelect(c)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-accent/10 ${
                c.code === selectedCountry.code ? "bg-accent/15 font-semibold" : ""
              }`}
            >
              <span className="text-base">{c.flag}</span>
              <span className="flex-1 text-left truncate">{c.name}</span>
              <span className="text-xs font-mono text-muted-foreground">{c.code}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          placeholder={selectedCountry.placeholder}
          value={rawNumber}
          onChange={(e) => handleNumberChange(e.target.value)}
          className="h-12 rounded-xl text-base bg-white/5 border-white/10 text-white placeholder:text-white/25"
        />
        {rawNumber.length > 3 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
              isValid ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
            }`}>
              {isValid ? "✓ Valide" : "Format incorrect"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
