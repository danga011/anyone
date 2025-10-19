/**
 * Supabase client bootstrap.
 * Replace URL and anon key with real Supabase project values before deployment.
 */

/* eslint-disable no-undef */
(function initializeSupabase() {
  const defaultConfig = {
    url: 'https://YOUR-PROJECT.supabase.co',
    anonKey: 'YOUR-ANON-KEY'
  };

  const externalConfig = window.__SUPABASE_CONFIG__ || {};
  const SUPABASE_URL = externalConfig.url || defaultConfig.url;
  const SUPABASE_ANON_KEY = externalConfig.anonKey || defaultConfig.anonKey;

  const hasValidConfig = Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR-PROJECT') &&
    !SUPABASE_ANON_KEY.includes('YOUR-ANON-KEY')
  );

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Supabase SDK is not available. Falling back to local leaderboard.');
    window.supabaseClient = null;
    window.SUPABASE_ENABLED = false;
    return;
  }

  if (!hasValidConfig) {
    console.info('Supabase configuration is missing. Provide values via window.__SUPABASE_CONFIG__ or edit this file.');
    window.supabaseClient = null;
    window.SUPABASE_ENABLED = false;
    return;
  }

  try {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false
      }
    });
    window.SUPABASE_ENABLED = true;
    console.log('Supabase client initialized.');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    window.supabaseClient = null;
    window.SUPABASE_ENABLED = false;
  }
})();
