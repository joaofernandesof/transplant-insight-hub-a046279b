import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
}

interface PatientAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectPatient?: (patient: Patient) => void;
  placeholder?: string;
  className?: string;
}

export function PatientAutocomplete({
  value,
  onChange,
  onSelectPatient,
  placeholder = "Buscar paciente...",
  className,
}: PatientAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setPatients([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      
      // Search in neohub_users (patients with 'patient' profile)
      const { data: neohubPatients } = await supabase
        .from('neohub_users')
        .select('id, full_name, phone, email')
        .ilike('full_name', `%${value}%`)
        .limit(10);

      // Also search in clinic_patients
      const { data: clinicPatients } = await supabase
        .from('clinic_patients')
        .select('id, full_name, phone, email')
        .ilike('full_name', `%${value}%`)
        .limit(10);

      // Merge and deduplicate by name
      const allPatients: Patient[] = [];
      const seenNames = new Set<string>();

      [...(neohubPatients || []), ...(clinicPatients || [])].forEach(p => {
        const normalizedName = p.full_name.toLowerCase().trim();
        if (!seenNames.has(normalizedName)) {
          seenNames.add(normalizedName);
          allPatients.push({
            id: p.id,
            full_name: p.full_name,
            phone: p.phone || undefined,
            email: p.email || undefined,
          });
        }
      });

      setPatients(allPatients);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSelect = (patient: Patient) => {
    onChange(patient.full_name);
    onSelectPatient?.(patient);
    setOpen(false);
  };

  return (
    <Popover open={open && (patients.length > 0 || isLoading)} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={`relative ${className}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (e.target.value.length >= 2) {
                setOpen(true);
              }
            }}
            onFocus={() => {
              if (value.length >= 2 && patients.length > 0) {
                setOpen(true);
              }
            }}
            className="pl-9 pr-9"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[100] bg-popover border shadow-lg" 
        align="start"
        sideOffset={4}
      >
        <Command className="bg-transparent">
          <CommandList className="max-h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Buscando...</span>
              </div>
            ) : patients.length === 0 ? (
              <CommandEmpty>Nenhum paciente encontrado</CommandEmpty>
            ) : (
              <CommandGroup heading="Pacientes">
                {patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={patient.full_name}
                    onSelect={() => handleSelect(patient)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{patient.full_name}</p>
                        {patient.phone && (
                          <p className="text-xs text-muted-foreground truncate">{patient.phone}</p>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
