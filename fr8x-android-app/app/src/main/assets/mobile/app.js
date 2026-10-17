// FR8X Enterprise Mobile v2.4.0 — Offline & Resilience Engine
'use strict';

window.FR8X_RESILIENCE = {
  version: '2.4.0',
  reconnect: function() {
    if (window.FR8XAndroid && typeof window.FR8XAndroid.reloadProduction === 'function') {
      window.FR8XAndroid.reloadProduction();
    } else {
      window.location.href = 'https://con.fr8x.in';
    }
  }
};
