import { App, URLOpenListenerEvent } from '@capacitor/app';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

/**
 * Hook para gerenciar Deep Links (Universal Links iOS / App Links Android)
 * 
 * Configuração necessária no iOS (apple-app-site-association):
 * {
 *   "applinks": {
 *     "apps": [],
 *     "details": [{
 *       "appID": "TEAM_ID.app.lovable.d75807d51df7446daac336166617be60",
 *       "paths": ["/*"]
 *     }]
 *   }
 * }
 * 
 * Configuração necessária no Android (assetlinks.json):
 * [{
 *   "relation": ["delegate_permission/common.handle_all_urls"],
 *   "target": {
 *     "namespace": "android_app",
 *     "package_name": "app.lovable.d75807d51df7446daac336166617be60",
 *     "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
 *   }
 * }]
 */
export function useDeepLinks() {
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    // Handle deep link when app is opened via URL
    const handleAppUrlOpen = (event: URLOpenListenerEvent) => {
      console.log('Deep link received:', event.url);
      
      try {
        const url = new URL(event.url);
        const path = url.pathname + url.search;
        
        // Navigate to the path
        if (path && path !== '/') {
          navigate(path);
        }
      } catch (err) {
        console.error('Error parsing deep link:', err);
      }
    };

    // Add listener for app URL open events
    const listener = App.addListener('appUrlOpen', handleAppUrlOpen);

    // Check if app was opened from a deep link (cold start)
    App.getLaunchUrl().then((result) => {
      if (result?.url) {
        console.log('App launched from deep link:', result.url);
        try {
          const url = new URL(result.url);
          const path = url.pathname + url.search;
          
          if (path && path !== '/') {
            navigate(path);
          }
        } catch (err) {
          console.error('Error parsing launch URL:', err);
        }
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, isNative]);
}

/**
 * Gera a configuração necessária para Deep Links
 */
export function getDeepLinkConfig() {
  const appId = 'app.lovable.d75807d51df7446daac336166617be60';
  const domain = 'transplant-insight-hub.lovable.app';
  
  return {
    appId,
    domain,
    // iOS apple-app-site-association content
    appleAppSiteAssociation: {
      applinks: {
        apps: [],
        details: [
          {
            appID: `TEAM_ID.${appId}`,
            paths: ['/*'],
          },
        ],
      },
      webcredentials: {
        apps: [`TEAM_ID.${appId}`],
      },
    },
    // Android assetlinks.json content (fingerprint needs to be replaced)
    androidAssetLinks: [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: appId,
          sha256_cert_fingerprints: ['YOUR_SHA256_FINGERPRINT'],
        },
      },
    ],
  };
}
