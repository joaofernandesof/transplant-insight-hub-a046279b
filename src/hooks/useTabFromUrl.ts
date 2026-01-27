/**
 * Hook reutilizável para sincronizar abas com query params da URL
 * Permite deep linking e navegação com botão voltar do browser
 */

import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

interface UseTabFromUrlOptions {
  /** Nome do parâmetro na URL (default: "tab") */
  paramName?: string;
  /** Valor padrão quando não há param na URL */
  defaultTab: string;
  /** Lista de valores válidos (opcional - para validação) */
  validTabs?: string[];
}

export function useTabFromUrl({
  paramName = "tab",
  defaultTab,
  validTabs,
}: UseTabFromUrlOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Pega o valor da URL ou usa o default
  const getTabFromUrl = useCallback(() => {
    const urlTab = searchParams.get(paramName);
    
    // Se não há valor na URL, retorna default
    if (!urlTab) return defaultTab;
    
    // Se há validação e o valor não é válido, retorna default
    if (validTabs && !validTabs.includes(urlTab)) return defaultTab;
    
    return urlTab;
  }, [searchParams, paramName, defaultTab, validTabs]);

  const [activeTab, setActiveTabState] = useState(getTabFromUrl);

  // Atualiza o estado quando a URL muda (ex: botão voltar)
  useEffect(() => {
    const newTab = getTabFromUrl();
    if (newTab !== activeTab) {
      setActiveTabState(newTab);
    }
  }, [searchParams, getTabFromUrl, activeTab]);

  // Função para mudar a aba (atualiza URL e estado)
  const setActiveTab = useCallback(
    (newTab: string) => {
      setActiveTabState(newTab);
      
      // Atualiza a URL preservando outros params
      const newParams = new URLSearchParams(searchParams);
      
      if (newTab === defaultTab) {
        // Remove o param se for o default (URL mais limpa)
        newParams.delete(paramName);
      } else {
        newParams.set(paramName, newTab);
      }
      
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams, paramName, defaultTab]
  );

  return { activeTab, setActiveTab };
}
