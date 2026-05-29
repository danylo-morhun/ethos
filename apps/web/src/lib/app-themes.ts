// Fix 7: single source of truth for app paths, names, and themes
// AppSidebar imports APPS_CONFIG so path/name are never duplicated
export const APPS_CONFIG = {
  '/midas': { theme: 'theme-midas', name: 'Midas' },
} satisfies Record<string, { theme: string; name: string }>;

export const APP_THEMES = Object.fromEntries(
  Object.entries(APPS_CONFIG).map(([path, { theme }]) => [path, theme]),
) as Record<string, string>;

export function getAppForPath(pathname: string) {
  for (const [prefix, config] of Object.entries(APPS_CONFIG)) {
    if (pathname.startsWith(prefix)) return config;
  }
  return null;
}

export function getThemeForPath(pathname: string): string {
  return getAppForPath(pathname)?.theme ?? '';
}
