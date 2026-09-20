// ============================================================
// GET /widget.js
// Standalone Embeddable In-App Changelog Popup Widget
// Floating chatbot-style bubble in bottom-right with collapsible
// "What's New" updates modal, reactions, and zero styling conflicts.
// ============================================================

import { NextResponse } from 'next/server'

export async function GET() {
  const widgetCode = `
(function() {
  if (window.__SHIPPULSE_WIDGET_INITIALIZED__) return;
  window.__SHIPPULSE_WIDGET_INITIALIZED__ = true;

  function initWidget() {
    var currentScript = document.currentScript 
      || document.querySelector('script[data-project]') 
      || document.querySelector('script[src*="widget.js"]');
    
    var projectSlug = (currentScript && currentScript.getAttribute('data-project')) 
      || window.SHIPPULSE_PROJECT 
      || 'shippulse';

    var hostOrigin = (currentScript && currentScript.src && currentScript.src.indexOf('http') === 0)
      ? new URL(currentScript.src).origin
      : window.location.origin;

    // Check if already mounted
    if (document.getElementById('shippulse-widget-root')) return;

    var host = document.createElement('div');
    host.id = 'shippulse-widget-root';
    document.body.appendChild(host);
    var shadow = host.attachShadow({ mode: 'open' });

    var styles = document.createElement('style');
    styles.textContent = \`
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      
      /* Launcher Button - Chatbot bubble */
      .sp-launcher {
        position: fixed;
        bottom: 24px;
        right: 24px;
        height: 54px;
        min-width: 54px;
        padding: 0 16px;
        border-radius: 27px;
        background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
        color: #FFFFFF;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 10px 25px -3px rgba(99, 102, 241, 0.5), 0 4px 10px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 2147483646;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
        outline: none;
      }
      .sp-launcher:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 14px 30px -3px rgba(99, 102, 241, 0.65), 0 6px 12px rgba(0, 0, 0, 0.35);
      }
      .sp-launcher:active {
        transform: translateY(0) scale(0.98);
      }
      .sp-launcher-icon {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.25s ease;
      }
      .sp-launcher.is-open .sp-launcher-icon {
        transform: rotate(90deg);
      }
      .sp-launcher-label {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: -0.01em;
        white-space: nowrap;
      }
      .sp-launcher-badge {
        position: absolute;
        top: -3px;
        right: -3px;
        background: #EF4444;
        color: #FFFFFF;
        font-size: 10px;
        font-weight: 700;
        height: 18px;
        min-width: 18px;
        padding: 0 5px;
        border-radius: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #0B0F19;
        box-shadow: 0 2px 5px rgba(239, 68, 68, 0.5);
        animation: spPulse 2s infinite;
      }
      @keyframes spPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      /* Chatbot-style Popup Modal Card */
      .sp-popup {
        position: fixed;
        bottom: 90px;
        right: 24px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 550px;
        max-height: calc(100vh - 120px);
        background: #0B0F19;
        color: #F1F5F9;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(99, 102, 241, 0.15);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
        transform: scale(0.92) translateY(16px);
        transform-origin: bottom right;
        transition: opacity 0.22s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(16px);
      }
      .sp-popup.open {
        opacity: 1;
        pointer-events: auto;
        transform: scale(1) translateY(0);
      }

      /* Header */
      .sp-header {
        padding: 16px 20px;
        background: linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .sp-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .sp-avatar {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
      }
      .sp-header-titles {
        display: flex;
        flex-direction: column;
      }
      .sp-title {
        font-size: 14px;
        font-weight: 700;
        color: #FFFFFF;
        line-height: 1.2;
      }
      .sp-subtitle {
        font-size: 11px;
        color: #94A3B8;
        margin-top: 2px;
      }
      .sp-close-btn {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: none;
        background: rgba(255, 255, 255, 0.06);
        color: #94A3B8;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      .sp-close-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #FFFFFF;
      }

      /* Body & Feed */
      .sp-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
      }
      .sp-body::-webkit-scrollbar { width: 4px; }
      .sp-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 2px; }

      .sp-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 14px;
        padding: 14px;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .sp-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.12);
      }
      .sp-card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .sp-badges {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sp-tag {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 2px 7px;
        border-radius: 6px;
        background: rgba(99, 102, 241, 0.15);
        color: #A5B4FC;
        border: 1px solid rgba(99, 102, 241, 0.3);
      }
      .sp-version {
        font-size: 11px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-weight: 600;
        color: #818CF8;
      }
      .sp-date {
        font-size: 11px;
        color: #64748B;
      }
      .sp-card-title {
        font-size: 13px;
        font-weight: 600;
        color: #F8FAFC;
        line-height: 1.35;
        margin-bottom: 6px;
      }
      .sp-card-desc {
        font-size: 12px;
        color: #94A3B8;
        line-height: 1.5;
      }

      /* Reactions bar */
      .sp-reactions {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }
      .sp-reaction-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 3px 8px;
        font-size: 11px;
        color: #94A3B8;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
      }
      .sp-reaction-btn:hover {
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.3);
        color: #FFFFFF;
      }
      .sp-reaction-btn.reacted {
        background: rgba(99, 102, 241, 0.25);
        border-color: #6366F1;
        color: #A5B4FC;
      }

      /* Footer */
      .sp-footer {
        padding: 12px 16px;
        background: rgba(15, 23, 42, 0.7);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
      }
      .sp-full-link {
        color: #818CF8;
        text-decoration: none;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .sp-full-link:hover {
        color: #A5B4FC;
        text-decoration: underline;
      }
      .sp-branding {
        color: #64748B;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .sp-branding:hover {
        color: #94A3B8;
      }
    \`;
    shadow.appendChild(styles);

    // Launcher button
    var launcher = document.createElement('button');
    launcher.className = 'sp-launcher';
    launcher.setAttribute('aria-label', "Open What's New");
    launcher.innerHTML = \`
      <div class="sp-launcher-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      </div>
      <span class="sp-launcher-label">What's New</span>
      <span class="sp-launcher-badge">1</span>
    \`;
    shadow.appendChild(launcher);

    // Popup card
    var popup = document.createElement('div');
    popup.className = 'sp-popup';
    popup.innerHTML = \`
      <div class="sp-header">
        <div class="sp-header-left">
          <div class="sp-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div class="sp-header-titles">
            <span class="sp-title">What's New</span>
            <span class="sp-subtitle" id="sp-proj-name">\${projectSlug} updates</span>
          </div>
        </div>
        <button class="sp-close-btn" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="sp-body" id="sp-releases-container">
        <p style="font-size:12px; color:#94A3B8; text-align:center; padding:30px 0;">Loading latest updates...</p>
      </div>
      <div class="sp-footer">
        <a href="\${hostOrigin}/\${projectSlug}" target="_blank" class="sp-full-link" id="sp-full-link">
          <span>View all releases</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
        <a href="https://ship-pulse.vercel.app" target="_blank" class="sp-branding">
          <span>⚡ ShipPulse</span>
        </a>
      </div>
    \`;
    shadow.appendChild(popup);

    // Toggle collapse function
    function togglePopup() {
      var isOpen = popup.classList.contains('open');
      if (isOpen) {
        popup.classList.remove('open');
        launcher.classList.remove('is-open');
      } else {
        popup.classList.add('open');
        launcher.classList.add('is-open');
        var badge = shadow.querySelector('.sp-launcher-badge');
        if (badge) badge.style.display = 'none';
      }
    }

    launcher.addEventListener('click', togglePopup);
    popup.querySelector('.sp-close-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      popup.classList.remove('open');
      launcher.classList.remove('is-open');
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && popup.classList.contains('open')) {
        popup.classList.remove('open');
        launcher.classList.remove('is-open');
      }
    });

    // Close when clicking outside of the widget
    document.addEventListener('click', function(e) {
      if (!host.contains(e.target) && popup.classList.contains('open')) {
        popup.classList.remove('open');
        launcher.classList.remove('is-open');
      }
    });

    // Fetch REAL releases from the project — no mock data
    fetch(hostOrigin + '/api/public/changelog?projectSlug=' + encodeURIComponent(projectSlug))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var container = shadow.getElementById('sp-releases-container');
        if (!container) return;

        // Update header with real project name and link
        if (data.projectName) {
          var projLabel = shadow.getElementById('sp-proj-name');
          if (projLabel) projLabel.textContent = data.projectName + ' updates';
          var fullLink = shadow.getElementById('sp-full-link');
          if (fullLink && data.slug) fullLink.href = hostOrigin + '/' + data.slug;
        }

        var releases = data.releases || [];

        // Update badge with real count — hide if nothing yet
        var badge = shadow.querySelector('.sp-launcher-badge');
        if (badge) {
          if (releases.length === 0) {
            badge.style.display = 'none';
          } else {
            badge.textContent = releases.length > 9 ? '9+' : String(releases.length);
          }
        }

        if (releases.length === 0) {
          container.innerHTML = '<p style="font-size:12px; color:#94A3B8; text-align:center; padding:30px 0;">No updates published yet — check back soon.</p>';
          return;
        }

        container.innerHTML = releases.slice(0, 8).map(function(r) {
          var cats = Array.isArray(r.categories) ? r.categories : [];
          var tag = cats[0] ? String(cats[0]).toUpperCase() : 'UPDATE';
          var version = r.version ? '<span class="sp-version">' + r.version + '</span>' : '';
          var dateStr = r.publishedAt ? new Date(r.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

          return '<div class="sp-card">'
            + '<div class="sp-card-meta">'
              + '<div class="sp-badges">'
                + '<span class="sp-tag">' + tag + '</span>'
                + version
              + '</div>'
              + '<span class="sp-date">' + dateStr + '</span>'
            + '</div>'
            + '<h4 class="sp-card-title">' + (r.title || 'Product Update') + '</h4>'
            + (r.summary ? '<p class="sp-card-desc">' + r.summary + '</p>' : '')
            + '<div class="sp-reactions">'
              + '<button class="sp-reaction-btn" onclick="this.classList.toggle(\\'reacted\\')"><span>👍</span> <span>' + (r.reactions || 0) + '</span></button>'
              + '<button class="sp-reaction-btn" onclick="this.classList.toggle(\\'reacted\\')"><span>🚀</span></button>'
              + '<button class="sp-reaction-btn" onclick="this.classList.toggle(\\'reacted\\')"><span>❤️</span></button>'
            + '</div>'
            + '</div>';
        }).join('');
      })
      .catch(function(err) {
        console.warn('[ShipPulse Widget] Fetch error:', err);
        var container = shadow.getElementById('sp-releases-container');
        if (container) {
          container.innerHTML = '<p style="font-size:12px; color:#94A3B8; text-align:center; padding:30px 0;">Unable to load updates.</p>';
        }
      });

    // Public API on window
    window.ShipPulse = {
      open: function() { popup.classList.add('open'); launcher.classList.add('is-open'); },
      close: function() { popup.classList.remove('open'); launcher.classList.remove('is-open'); },
      toggle: togglePopup,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
`

  return new NextResponse(widgetCode, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
