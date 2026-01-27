import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Banknote, Check, Clock } from 'lucide-react';
import { useRequestPixPayment, type StudentReferral } from '../hooks/useStudentReferrals';

interface PixRequestButtonProps {
  referral: StudentReferral;
}

export function PixRequestButton({ referral }: PixRequestButtonProps) {
  const requestPix = useRequestPixPayment();

  // Only show for settled referrals with contract value
  if (referral.status !== 'settled') {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  // If PIX already paid
  if (referral.pix_request_status === 'paid') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <Check className="h-3 w-3 mr-1" />
        Pago
      </Badge>
    );
  }

  // If PIX request is pending or approved
  if (referral.pix_request_status === 'pending' || referral.pix_request_status === 'approved') {
    return (
      <Badge variant="secondary" className="text-amber-600">
        <Clock className="h-3 w-3 mr-1" />
        {referral.pix_request_status === 'approved' ? 'Aprovado' : 'Solicitado'}
      </Badge>
    );
  }

  // Show request button
  const handleRequest = () => {
    requestPix.mutate(referral.id);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleRequest}
      disabled={requestPix.isPending || !referral.contract_value}
      className="gap-1 text-xs"
    >
      {requestPix.isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Banknote className="h-3 w-3" />
      )}
      Solicitar PIX
    </Button>
  );
}
