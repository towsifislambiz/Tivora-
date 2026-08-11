/**
 * useAppUpdateChecker — Production Update Checker for Tivora Android App
 *
 * Behavior:
 * - Runs ONCE at app startup (not on every render)
 * - Caches result in localStorage for 24 hours
 * - Handles: offline, timeout, GitHub API failure — all gracefully
 * - App continues working normally if update server is unavailable
 */

import { useState, useEffect, useRef } from 'react';

const GITHUB_OWNER = 'towsifislambiz';
const GITHUB_REPO = 'Tivora-';
const CACHE_KEY = 'tivora_update_check';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_TIMEOUT_MS = 5000; // 5 second timeout

/**
 * Compare two semver strings.
 * Returns true if latest > current.
 */
function isNewerVersion(current, latest) {
  if (!current || !latest) return false;
  try {
    const parse = (v) => v.replace(/^v/, '').split('.').map(Number);
    const [cMaj, cMin, cPat] = parse(current);
    const [lMaj, lMin, lPat] = parse(latest);
    if (lMaj !== cMaj) return lMaj > cMaj;
    if (lMin !== cMin) return lMin > cMin;
    return lPat > cPat;
  } catch {
    return false;
  }
}

/**
 * Fetch with a timeout. Throws on timeout or network error.
 */
async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Read cached update check result.
 * Returns null if cache is missing or expired.
 */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    // Cache for 30 minutes instead of 24 hours so new deployments update fast
    if (Date.now() - cached.timestamp > 30 * 60 * 1000) return null;
    return cached;
  } catch {
    return null;
  }
}

/**
 * Write update check result to cache.
 */
function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...data,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage not available (private browsing etc) — skip cache
  }
}

/**
 * Clear the update check cache (used by manual "Check for Updates").
 */
export function clearUpdateCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Main hook.
 *
 * @param {boolean} enabled - Set to false to disable the checker (e.g., in web browser).
 * @returns {{
 *   updateAvailable: boolean,
 *   latestVersion: string|null,
 *   latestDownloadUrl: string|null,
 *   currentVersion: string,
 *   checking: boolean,
 *   checkForUpdates: () => void,
 * }}
 */
export function useAppUpdateChecker({ enabled = true } = {}) {
  const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [latestDownloadUrl, setLatestDownloadUrl] = useState(null);
  const [checking, setChecking] = useState(false);
  const hasCheckedRef = useRef(false);

  const performCheck = async (forceRefresh = false) => {
    if (!enabled) return;
    if (!navigator.onLine) return; // Offline — skip silently

    setChecking(true);

    try {
      // Try cache first (unless forced refresh)
      if (!forceRefresh) {
        const cached = readCache();
        if (cached) {
          if (isNewerVersion(currentVersion, cached.latestVersion)) {
            setLatestVersion(cached.latestVersion);
            setLatestDownloadUrl(cached.downloadUrl);
            setUpdateAvailable(true);
          }
          setChecking(false);
          return;
        }
      }

      // Fetch latest release from GitHub API
      const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
      const res = await fetchWithTimeout(apiUrl, FETCH_TIMEOUT_MS);

      if (!res.ok) {
        // GitHub API unavailable or rate-limited — fail silently
        setChecking(false);
        return;
      }

      const data = await res.json();
      const latest = data.tag_name?.replace(/^v/, '') ?? null;

      // Find the APK download URL from release assets
      const apkAsset = data.assets?.find(a => a.name.endsWith('.apk'));
      const downloadUrl = apkAsset?.browser_download_url
        ?? `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest/download/Tivora.apk`;

      // Cache the result
      writeCache({ latestVersion: latest, downloadUrl });

      if (isNewerVersion(currentVersion, latest)) {
        setLatestVersion(latest);
        setLatestDownloadUrl(downloadUrl);
        setUpdateAvailable(true);
      }
    } catch (err) {
      // Network error, timeout, or any unexpected error — app continues normally
      if (err.name !== 'AbortError') {
        console.warn('[Tivora Update Checker] Could not reach update server:', err.message);
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!enabled || hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // Delay the startup check by 3 seconds so it doesn't interfere with app load
    const timer = setTimeout(() => {
      performCheck(false);
    }, 3000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    updateAvailable,
    latestVersion,
    latestDownloadUrl,
    currentVersion,
    checking,
    checkForUpdates: () => {
      clearUpdateCache();
      setUpdateAvailable(false);
      performCheck(true);
    },
  };
}
