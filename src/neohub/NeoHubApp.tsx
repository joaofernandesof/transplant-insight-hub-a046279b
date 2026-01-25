// ====================================
// NeoHubApp - Legacy file (deprecated)
// ====================================
// Este arquivo foi mantido apenas para compatibilidade.
// O roteamento principal agora está em src/App.tsx
// usando UnifiedSidebar como sidebar única do sistema.

import React from 'react';
import { Navigate } from 'react-router-dom';

// This module is deprecated - all routing now happens in App.tsx
export default function NeoHubApp() {
  // Redirect to main app routing
  return <Navigate to="/" replace />;
}
