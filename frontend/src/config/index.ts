/**
 * Application Runtime Configuration
 */
export const APP_CONFIG = {
  name: "Mey Veda Grantha",
  version: "1.0.0",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  environment: import.meta.env.VITE_APP_ENV || "development",
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  portals: {
    doctor: {
      title: "Doctor Clinical Workspace",
      path: "/workspace",
    },
    admin: {
      title: "Platform Administration",
      path: "/admin",
    },
    manufacturer: {
      title: "Manufacturer Form 25D Portal",
      path: "/manufacturer",
    },
  },
} as const;

export default APP_CONFIG;
