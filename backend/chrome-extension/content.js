// ============================================================
// CHROME EXTENSION: Content Script
// Purpose: Detect LinkedIn signals on the page and send to background
// Runs on: https://www.linkedin.com/*
// ============================================================

(function() {
  'use strict';

  const SIGNAL_TYPES = {
    JOB_CHANGE: 'job_change',
    PROFILE_VIEW: 'profile_view',
    POST_ENGAGEMENT: 'post_engagement',
    CONNECTION: 'connection',
    COMPANY_UPDATE: 'company_update',
  };

  // Track current page state
  let currentPageType = null;
  let currentProfileData = null;
  let observer = null;

  // Initialize
  function init() {
    console.log('[RevFlow] Content script loaded');
    
    // Detect page type
    detectPageType();
    
    // Set up MutationObserver to detect dynamic content changes
    setupObserver();
    
    // Listen for URL changes (SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        detectPageType();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  /**
   * Detect what type of LinkedIn page we're on
   */
  function detectPageType() {
    const url = window.location.href;

    // Profile page
    if (url.match(/linkedin\.com\/in\/[^\/]+/)) {
      currentPageType = 'profile';
      extractProfileData();
    }
    // Feed / Home
    else if (url.match(/linkedin\.com\/feed/)) {
      currentPageType = 'feed';
      monitorFeedEngagement();
    }
    // Company page
    else if (url.match(/linkedin\.com\/company\/[^\/]+/)) {
      currentPageType = 'company';
      extractCompanyData();
    }
    // My Network / Connections
    else if (url.match(/linkedin\.com\/mynetwork/)) {
      currentPageType = 'network';
      monitorConnections();
    }
    else {
      currentPageType = 'other';
    }
  }

  /**
   * Extract profile data from LinkedIn profile page
   */
  function extractProfileData() {
    // Wait for profile to load
    const checkInterval = setInterval(() => {
      const nameEl = document.querySelector('h1');
      const titleEl = document.querySelector('.text-body-medium');
      const companyEl = document.querySelector('.text-body-medium[data-field="experience_company"]');
      const locationEl = document.querySelector('.text-body-small.inline');

      if (nameEl) {
        clearInterval(checkInterval);

        const profileData = {
          type: SIGNAL_TYPES.PROFILE_VIEW,
          actor: {
            name: nameEl.textContent?.trim() || '',
            title: titleEl?.textContent?.trim() || '',
            linkedin_url: window.location.href,
            profile_picture: document.querySelector('.pv-top-card-profile-picture__image')?.src || '',
          },
          company: companyEl ? {
            name: companyEl.textContent?.trim() || '',
          } : undefined,
          details: {
            location: locationEl?.textContent?.trim() || '',
          },
          timestamp: new Date().toISOString(),
        };

        currentProfileData = profileData;

        // Check for "Recently joined" or job change indicators
        checkForJobChange(profileData);

        // Send profile view signal
        sendSignal(profileData);
      }
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  /**
   * Check if profile shows recent job change
   */
  function checkForJobChange(profileData) {
    // Look for "Just started" or similar indicators
    const experienceSection = document.querySelector('#experience-section');
    if (!experienceSection) return;

    const experienceItems = experienceSection.querySelectorAll('.experience-item');
    if (experienceItems.length === 0) return;

    const mostRecent = experienceItems[0];
    const dateText = mostRecent.querySelector('.pvs-entity__caption')?.textContent || '';

    // Check for recent date indicators
    const recentIndicators = ['just started', 'recently joined', 'new position', 'present'];
    const isRecent = recentIndicators.some(indicator => 
      dateText.toLowerCase().includes(indicator)
    );

    if (isRecent) {
      // Send job change signal
      const jobChangeSignal = {
        type: SIGNAL_TYPES.JOB_CHANGE,
        actor: profileData.actor,
        company: profileData.company,
        details: {
          ...profileData.details,
          new_title: profileData.actor.title,
          start_date: dateText,
        },
        timestamp: new Date().toISOString(),
      };

      sendSignal(jobChangeSignal);
    }
  }

  /**
   * Monitor feed for post engagement
   */
  function monitorFeedEngagement() {
    // Look for posts with high engagement
    const posts = document.querySelectorAll('.feed-shared-update-v2');
    
    posts.forEach(post => {
      const reactionsEl = post.querySelector('.social-details-reaction-count');
      const commentsEl = post.querySelector('.social-details-comments-count');
      
      if (reactionsEl || commentsEl) {
        const reactions = parseCount(reactionsEl?.textContent || '0');
        const comments = parseCount(commentsEl?.textContent || '0');

        // If post has significant engagement, send signal
        if (reactions > 50 || comments > 10) {
          const authorEl = post.querySelector('.update-components-actor__title');
          const authorName = authorEl?.textContent?.trim() || '';

          if (authorName) {
            const engagementSignal = {
              type: SIGNAL_TYPES.POST_ENGAGEMENT,
              actor: {
                name: authorName,
                title: '',
                linkedin_url: '',
              },
              details: {
                reactions,
                comments,
                post_url: window.location.href,
              },
              timestamp: new Date().toISOString(),
            };

            sendSignal(engagementSignal);
          }
        }
      }
    });
  }

  /**
   * Extract company page data
   */
  function extractCompanyData() {
    const checkInterval = setInterval(() => {
      const nameEl = document.querySelector('h1');
      const industryEl = document.querySelector('.org-top-module-summary__industry');
      const sizeEl = document.querySelector('.org-top-module-summary__employee-count');

      if (nameEl) {
        clearInterval(checkInterval);

        const companySignal = {
          type: SIGNAL_TYPES.COMPANY_UPDATE,
          actor: {
            name: nameEl.textContent?.trim() || '',
            title: '',
            linkedin_url: window.location.href,
          },
          details: {
            industry: industryEl?.textContent?.trim() || '',
            company_size: sizeEl?.textContent?.trim() || '',
          },
          timestamp: new Date().toISOString(),
        };

        sendSignal(companySignal);
      }
    }, 500);

    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  /**
   * Monitor connections page
   */
  function monitorConnections() {
    // Look for new connections
    const connections = document.querySelectorAll('.mn-connection-card');
    
    connections.forEach(conn => {
      const nameEl = conn.querySelector('.mn-connection-card__name');
      const titleEl = conn.querySelector('.mn-connection-card__description');
      const linkEl = conn.querySelector('a');

      if (nameEl && linkEl) {
        const connectionSignal = {
          type: SIGNAL_TYPES.CONNECTION,
          actor: {
            name: nameEl.textContent?.trim() || '',
            title: titleEl?.textContent?.trim() || '',
            linkedin_url: linkEl.href || '',
          },
          details: {},
          timestamp: new Date().toISOString(),
        };

        sendSignal(connectionSignal);
      }
    });
  }

  /**
   * Set up MutationObserver for dynamic content
   */
  function setupObserver() {
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          // Re-detect page type when content changes
          if (currentPageType === 'feed') {
            monitorFeedEngagement();
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Send signal to background script
   */
  function sendSignal(signal) {
    chrome.runtime.sendMessage({
      type: 'SIGNAL_DETECTED',
      signal,
    });
  }

  /**
   * Parse count from text (e.g., "1.2K" → 1200)
   */
  function parseCount(text) {
    const clean = text.replace(/[^\d.]/g, '');
    if (text.includes('K')) {
      return Math.round(parseFloat(clean) * 1000);
    }
    return parseInt(clean) || 0;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
