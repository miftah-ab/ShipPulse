// ============================================================
// GET /widget.js
// Standalone Embeddable In-App Changelog Widget
// Shadow DOM isolated, vanilla JS, zero bundle pollution
// ============================================================

import { NextResponse } from 'next/server'

export async function GET() {
  const widgetCode = `
(function() {
  if (window.ShipPulse) return;

  var currentScript = document.currentScript || document.querySelector('script[data-project]');
  var projectSlug = currentScript ? currentScript.getAttribute('data-project') : '';
  if (!projectSlug) return;
  var hostOrigin = currentScript ? new URL(currentScript.src).origin : window.location.origin;

  var host = document.createElement('div');
  host.id = 'shippulse-widget-root';
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: 'open' });

  var styles = document.createElement('style');
  styles.textContent = \`
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .sp-launcher {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 24px;
      background: #635BFF;
      color: white;
      border: none;
      box-shadow: 0 4px 14px rgba(99, 91, 255, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999998;
      transition: transform 0.2s, background 0.2s;
    }
    .sp-launcher:hover { transform: scale(1.05); background: #5248E2; }
    .sp-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #EF4444;
      color: white;
      font-size: 11px;
      font-weight: 700;
      height: 18px;
      width: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }
    .sp-drawer {
      position: fixed;
      top: 0;
      right: -420px;
      width: 400px;
      height: 100vh;
      background: #0B0D12;
      color: #F7F8FA;
      box-shadow: -4px 0 24px rgba(0,0,0,0.5);
      z-index: 999999;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
      border-left: 1px solid #1F2937;
    }
    .sp-drawer.open { right: 0; }
    .sp-header {
      padding: 18px 20px;
      border-bottom: 1px solid #1F2937;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #11141E;
    }
    .sp-title { font-weight: 700; font-size: 15px; margin: 0; }
    .sp-close { background: none; border: none; color: #9CA3AF; font-size: 20px; cursor: pointer; }
    .sp-body { flex: 1; overflow-y: auto; padding: 20px; }
    .sp-item { margin-bottom: 20px; padding: 14px; background: #161A26; border: 1px solid #23293D; border-radius: 10px; }
    .sp-item-title { font-weight: 600; font-size: 13px; margin: 0 0 6px 0; color: #FFFFFF; }
    .sp-item-desc { font-size: 12px; color: #9CA3AF; margin: 0; line-height: 1.4; }
    .sp-item-tag { display: inline-block; font-size: 10px; background: rgba(99, 91, 255, 0.2); color: #817CFF; padding: 2px 6px; border-radius: 4px; margin-bottom: 6px; font-weight: 600; }
  \`;
  shadow.appendChild(styles);

  var launcher = document.createElement('button');
  launcher.className = 'sp-launcher';
  launcher.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><span class="sp-badge">2</span>';
  shadow.appendChild(launcher);

  var drawer = document.createElement('div');
  drawer.className = 'sp-drawer';
  drawer.innerHTML = '<div class="sp-header"><h3 class="sp-title">What\'s New in ' + projectSlug + '</h3><button class="sp-close">&times;</button></div><div class="sp-body" id="sp-releases-container"><p style="font-size:12px;color:#9CA3AF;text-align:center;padding:20px 0;">Loading...</p></div>';
  shadow.appendChild(drawer);

  // Fetch real releases from the changelog API
  fetch(hostOrigin + '/api/public/changelog?projectSlug=' + encodeURIComponent(projectSlug))
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var container = shadow.getElementById('sp-releases-container');
      if (!container) return;
      var releases = data.releases || [];
      if (releases.length === 0) {
        container.innerHTML = '<p style="font-size:12px;color:#9CA3AF;text-align:center;padding:20px 0;">No releases yet.</p>';
        return;
      }
      container.innerHTML = releases.slice(0, 5).map(function(r) {
        var tag = (r.categories && r.categories[0]) ? r.categories[0].toUpperCase() : 'UPDATE';
        var version = r.version ? '<span style="font-size:10px;font-family:monospace;color:#817CFF;">' + r.version + '</span> ' : '';
        return '<div class="sp-item">'
          + '<span class="sp-item-tag">' + tag + '</span>'
          + '<h4 class="sp-item-title">' + version + r.title + '</h4>'
          + (r.summary ? '<p class="sp-item-desc">' + r.summary + '</p>' : '')
          + '</div>';
      }).join('');
    })
    .catch(function() {
      var container = shadow.getElementById('sp-releases-container');
      if (container) container.innerHTML = '<p style="font-size:12px;color:#9CA3AF;text-align:center;padding:20px 0;">Unable to load releases.</p>';
    });

  launcher.onclick = function() {
    drawer.classList.toggle('open');
  };

  drawer.querySelector('.sp-close').onclick = function() {
    drawer.classList.remove('open');
  };

  window.ShipPulse = {
    open: function() { drawer.classList.add('open'); },
    close: function() { drawer.classList.remove('open'); },
    refresh: function() { console.log('ShipPulse refreshed'); }
  };
})();
`

  return new NextResponse(widgetCode, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
