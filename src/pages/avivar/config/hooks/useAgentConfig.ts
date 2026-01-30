/**
 * Hook para gerenciar o estado da configuração do agente
 */

import { useState, useEffect, useCallback } from 'react';
import { AgentConfig, INITIAL_CONFIG, WIZARD_STEPS } from '../types';

const STORAGE_KEY = 'avivar_agent_config';

export function useAgentConfig() {
  const [config, setConfig] = useState<AgentConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...INITIAL_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading config from localStorage:', error);
    }
    return INITIAL_CONFIG;
  });

  const [currentStep, setCurrentStep] = useState(config.currentStep);

  // Auto-save to localStorage
  useEffect(() => {
    const updatedConfig = { ...config, currentStep, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
  }, [config, currentStep]);

  const updateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ ...INITIAL_CONFIG, createdAt: new Date().toISOString() });
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const completeWizard = useCallback(() => {
    updateConfig({ isComplete: true, updatedAt: new Date().toISOString() });
  }, [updateConfig]);

  const progress = Math.round((currentStep / (WIZARD_STEPS.length - 1)) * 100);

  return {
    config,
    updateConfig,
    currentStep,
    setCurrentStep: goToStep,
    nextStep,
    prevStep,
    resetConfig,
    completeWizard,
    progress,
    totalSteps: WIZARD_STEPS.length,
    currentStepInfo: WIZARD_STEPS[currentStep]
  };
}
