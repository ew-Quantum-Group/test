// Service Worker Registration Script - FIXED for PWA Installation
console.log('[PWA] Initializing PWA...');

// Global variables for install prompt
let deferredPrompt = null;
let installButtonAdded = false;

// Check if browser supports service workers
if ('serviceWorker' in navigator) {
  // Register service worker on page load
  window.addEventListener('load', function() {
    console.log('[PWA] Page loaded, registering service worker...');
    
    navigator.serviceWorker.register('./service-worker.js')
      .then(function(registration) {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] New service worker found:', newWorker);
          
          newWorker.addEventListener('statechange', () => {
            console.log('[PWA] New service worker state:', newWorker.state);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New content is available; please refresh.');
              showUpdateNotification();
            }
          });
        });
      })
      .catch(function(error) {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
  
  // Check if page is controlled by a service worker
  if (navigator.serviceWorker.controller) {
    console.log('[PWA] This page is controlled by a service worker');
  }
} else {
  console.warn('[PWA] Service workers are not supported in this browser');
}

// ========== PWA INSTALL PROMPT HANDLING ==========

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] beforeinstallprompt event fired');
  
  // Prevent Chrome from automatically showing the prompt
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Update UI to notify the user they can add to home screen
  console.log('[PWA] PWA can be installed');
  
  // Show install button
  showInstallButton();
  
  // Log for debugging
  console.log('[PWA] Deferred prompt saved, install button shown');
});

// Function to show install button
function showInstallButton() {
  if (installButtonAdded) return;
  
  // Check if button should be shown
  if (isPWAInstalled()) {
    console.log('[PWA] App already installed, hiding button');
    return;
  }
  
  // Create install button
  const installButton = document.createElement('button');
  installButton.id = 'pwaInstallButton';
  installButton.className = 'nav-button';
  installButton.innerHTML = '<i class="fas fa-download"></i> Installer App';
  installButton.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #8a2be2 0%, #ba55d3 100%);
    color: white !important;
    border: none !important;
    animation: pulseInstall 2s infinite;
  `;
  
  // Add click event
  installButton.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log('[PWA] Install button clicked');
    
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      showManualInstallInstructions();
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    try {
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`[PWA] User choice: ${choiceResult.outcome}`);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        installButton.style.display = 'none';
        showInstallSuccess();
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt variable
      deferredPrompt = null;
      
    } catch (error) {
      console.error('[PWA] Error during install:', error);
    }
  });
  
  // Find nav-actions container and add button
  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    navActions.insertBefore(installButton, navActions.firstChild);
    installButtonAdded = true;
    console.log('[PWA] Install button added to navigation');
  } else {
    // Fallback: add to body
    setTimeout(() => {
      const nav = document.querySelector('.nav');
      if (nav) {
        nav.appendChild(installButton);
        installButtonAdded = true;
        console.log('[PWA] Install button added to nav');
      }
    }, 1000);
  }
}

// Function to check if PWA is already installed
function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         navigator.standalone ||
         document.referrer.includes('android-app://');
}

// Listen for app installed event
window.addEventListener('appinstalled', (evt) => {
  console.log('[PWA] App was installed successfully');
  
  // Hide install button
  const installButton = document.getElementById('pwaInstallButton');
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  // Clear deferredPrompt
  deferredPrompt = null;
  
  // Show success message
  showInstallSuccess();
  
  // Update analytics or trigger other actions
  console.log('[PWA] Installation completed');
});

// Function to show installation success
function showInstallSuccess() {
  // Create success message
  const successMsg = document.createElement('div');
  successMsg.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInRight 0.5s ease;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
      max-width: 300px;
    ">
      <i class="fas fa-check-circle" style="font-size: 20px;"></i>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Application installée!</div>
        <div style="font-size: 14px; opacity: 0.9;">Retrouvez Eduwell SVT sur votre écran d'accueil</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(successMsg);
  
  // Remove after 4 seconds
  setTimeout(() => {
    successMsg.style.animation = 'slideOutRight 0.5s ease';
    setTimeout(() => successMsg.remove(), 500);
  }, 4000);
}

// Function to show update notification
function showUpdateNotification() {
  const updateMsg = document.createElement('div');
  updateMsg.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: var(--surface);
      color: var(--text-primary);
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      z-index: 10000;
      border: 2px solid var(--accent-purple);
      text-align: center;
    ">
      <div style="margin-bottom: 12px; font-weight: 600;">
        <i class="fas fa-sync-alt" style="color: var(--accent-purple); margin-right: 8px;"></i>
        Nouvelle version disponible
      </div>
      <div style="margin-bottom: 16px; font-size: 14px; color: var(--text-secondary);">
        Rechargez la page pour bénéficier des dernières améliorations
      </div>
      <button onclick="window.location.reload()" style="
        background: linear-gradient(135deg, #8a2be2 0%, #ba55d3 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 24px;
        font-weight: 500;
        cursor: pointer;
      ">
        Recharger maintenant
      </button>
    </div>
  `;
  
  document.body.appendChild(updateMsg);
  
  setTimeout(() => {
    updateMsg.remove();
  }, 10000);
}

// Function to show manual install instructions
function showManualInstallInstructions() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let instructions = '';
  
  if (isIOS) {
    instructions = `
      <strong>Pour installer sur iOS:</strong><br>
      1. Appuyez sur le bouton Partager (⎙)<br>
      2. Faites défiler vers le bas<br>
      3. Appuyez sur "Sur l'écran d'accueil"<br>
      4. Appuyez sur "Ajouter"
    `;
  } else if (isAndroid) {
    instructions = `
      <strong>Pour installer sur Android:</strong><br>
      1. Appuyez sur ⋮ (menu) en haut à droite<br>
      2. Appuyez sur "Ajouter à l'écran d'accueil"<br>
      3. Appuyez sur "Ajouter"
    `;
  } else {
    instructions = `
      <strong>Pour installer:</strong><br>
      1. Cherchez l'icône d'installation (↓) dans la barre d'adresse<br>
      2. Ou utilisez le menu du navigateur<br>
      3. Sélectionnez "Installer l'application"
    `;
  }
  
  alert(`Installation manuelle requise:\n\n${instructions}`);
}

// Check PWA status on load
function checkPWAStatus() {
  if (isPWAInstalled()) {
    console.log('[PWA] App is already installed in standalone mode');
    document.documentElement.classList.add('pwa-installed');
  } else {
    console.log('[PWA] App is not installed yet');
    
    // Try to show install button after a delay
    setTimeout(() => {
      if (!installButtonAdded && deferredPrompt) {
        showInstallButton();
      }
    }, 2000);
  }
}

// Initial check
setTimeout(checkPWAStatus, 1000);

// Check again when page becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(checkPWAStatus, 500);
  }
});

// Export function for manual trigger (for testing)
window.triggerPWAInstall = function() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
  } else {
    console.log('[PWA] No install prompt available');
    showManualInstallInstructions();
  }
};

// Log PWA status for debugging
console.log('[PWA] Status:', {
  displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
  isIOSStandalone: navigator.standalone,
  isHTTPS: window.location.protocol === 'https:',
  userAgent: navigator.userAgent.substring(0, 50)
});
