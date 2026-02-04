/**
 * PhoneInput - Input com máscara de telefone brasileiro
 * Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onChange?: (value: string) => void;
  value?: string;
}

/**
 * Formata um valor para o padrão de telefone brasileiro
 * Entrada: "85999395239" -> Saída: "(85) 99939-5239"
 */
export function formatPhone(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");
  
  // Limita a 11 dígitos (DDD + 9 dígitos)
  const limited = numbers.slice(0, 11);
  
  // Aplica a máscara progressivamente
  if (limited.length === 0) return "";
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  }
  // 11 dígitos (celular com 9)
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

/**
 * Extrai apenas os números de um telefone formatado
 */
export function extractPhoneNumbers(formattedPhone: string): string {
  return formattedPhone.replace(/\D/g, "");
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value = "", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const formatted = formatPhone(rawValue);
      
      if (onChange) {
        onChange(formatted);
      }
    };

    // Garante que o valor exibido está formatado
    const displayValue = React.useMemo(() => {
      if (!value) return "";
      // Se já está formatado, retorna como está
      if (value.includes("(") || value.includes(")") || value.includes("-")) {
        return value;
      }
      // Se são apenas números, formata
      return formatPhone(value);
    }, [value]);

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        className={cn(className)}
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
