const SAFE_NEXT_PATHS = new Set(["/", "/dashboard", "/reset-password"])

export function getSafeNextPath(value: string | null, fallback = "/dashboard") {
  if (!value) return fallback
  if (!value.startsWith("/") || value.startsWith("//")) return fallback
  const path = value.split("?")[0].split("#")[0]
  return SAFE_NEXT_PATHS.has(path) ? value : fallback
}
