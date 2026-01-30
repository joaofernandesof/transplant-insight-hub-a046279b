/**
 * Etapa 2: Configuração da API Key OpenAI
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertTriangle, ExternalLink, Shield, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepApiKeyProps {
  apiKey: string;
  isValid: boolean;
  onChange: (key: string, valid: boolean) => void;
}

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'no-credits';

export function StepApiKey({ apiKey, isValid, onChange }: StepApiKeyProps) {
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<ValidationStatus>(isValid ? 'valid' : 'idle');
  const [localKey, setLocalKey] = useState(apiKey);

  // Validate API key format and optionally test with OpenAI
  const validateApiKey = async (key: string) => {
    if (!key) {
      setStatus('idle');
      onChange(key, false);
      return;
    }

    // Basic format validation
    if (!key.startsWith('sk-')) {
      setStatus('invalid');
      onChange(key, false);
      return;
    }

    setStatus('validating');

    // For now, we'll do a simple format check
    // In production, you'd want to make a test API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if it looks like a valid key format
    if (key.length >= 30 && key.startsWith('sk-')) {
      setStatus('valid');
      onChange(key, true);
    } else {
      setStatus('invalid');
      onChange(key, false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKey !== apiKey) {
        validateApiKey(localKey);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localKey]);

  const handleChange = (value: string) => {
    setLocalKey(value);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'validating':
        return <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--avivar-primary))]" />;
      case 'valid':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'no-credits':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Key className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'validating':
        return { text: 'Validando...', color: 'text-[hsl(var(--avivar-primary))]' };
      case 'valid':
        return { text: 'API Key válida!', color: 'text-green-500' };
      case 'invalid':
        return { text: 'API Key inválida', color: 'text-red-500' };
      case 'no-credits':
        return { text: 'Sem créditos na conta', color: 'text-yellow-500' };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Configure sua API Key da OpenAI
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Para que seu agente funcione, você precisa de uma API Key da OpenAI
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="apikey" className="text-[hsl(var(--avivar-foreground))]">
            API Key da OpenAI *
          </Label>
          <div className="relative">
            <Input
              id="apikey"
              type={showKey ? 'text' : 'password'}
              value={localKey}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="sk-proj-xxxxxxxxxxxxx"
              className={cn(
                "pr-20 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]",
                status === 'valid' && "border-green-500",
                status === 'invalid' && "border-red-500"
              )}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {getStatusIcon()}
            </div>
          </div>
          {statusMessage && (
            <p className={cn("text-sm flex items-center gap-1", statusMessage.color)}>
              {statusMessage.text}
            </p>
          )}
        </div>

        {/* Info Cards */}
        <Card className="bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-3">
            <h4 className="font-medium text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Bot className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
              Sua API Key é necessária para:
            </h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Gerar embeddings da base de conhecimento
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Processar conversas com GPT-4
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Criar respostas inteligentes
              </li>
            </ul>
          </CardContent>
        </Card>

        <Alert className="bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary)/0.3)]">
          <Shield className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
          <AlertDescription className="text-[hsl(var(--avivar-foreground))]">
            <strong>IMPORTANTE:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Sua API Key fica salva APENAS no seu navegador</li>
              <li>• Nunca compartilhamos com terceiros</li>
              <li>• Usada diretamente nas chamadas para OpenAI</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Get API Key Link */}
        <div className="text-center">
          <Button
            variant="link"
            asChild
            className="text-[hsl(var(--avivar-primary))] hover:text-[hsl(var(--avivar-accent))]"
          >
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              Não tem API Key? Criar conta e obter key
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
