/**
 * Módulo Financeiro - Contas a Pagar
 */

import { DollarSign } from "lucide-react";
import AccountsPayable from "./components/financial/AccountsPayable";

export default function IpromedFinancial() {
  return (
    <div className="space-y-6 max-w-full">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-primary" />
          Contas a Pagar
        </h1>
        <p className="text-muted-foreground text-sm">
          Gestão de contas a pagar
        </p>
      </div>

      <AccountsPayable />
    </div>
  );
}
