/**
 * Hook para buscar dados do Conta Azul via edge function proxy
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContaAzulItem {
  id: string;
  nome: string;
  [key: string]: any;
}

async function fetchContaAzul(endpoint: string, params?: Record<string, string>): Promise<ContaAzulItem[]> {
  const { data, error } = await supabase.functions.invoke('conta-azul-proxy', {
    body: { endpoint, params },
  });

  if (error) throw new Error(error.message);

  // Conta Azul returns { itens: [...] } or array directly
  const items = data?.itens || data?.items || (Array.isArray(data) ? data : []);
  return items;
}

export function useContaAzulCategorias() {
  return useQuery({
    queryKey: ['conta-azul', 'categorias'],
    queryFn: () => fetchContaAzul('categorias'),
    staleTime: 30 * 60 * 1000, // 30 min cache
    retry: 1,
  });
}

export function useContaAzulCentrosDeCusto() {
  return useQuery({
    queryKey: ['conta-azul', 'centro-de-custo'],
    queryFn: () => fetchContaAzul('centro-de-custo'),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

export function useContaAzulContasFinanceiras() {
  return useQuery({
    queryKey: ['conta-azul', 'conta-financeira'],
    queryFn: () => fetchContaAzul('conta-financeira'),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
