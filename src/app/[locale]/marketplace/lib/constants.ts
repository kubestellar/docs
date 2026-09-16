import { LayoutDashboard, Palette, Puzzle } from "lucide-react";

export const TYPE_CONFIG = {
  dashboard: {
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  "card-preset": {
    label: "Card Preset",
    icon: Puzzle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  theme: {
    label: "Theme",
    icon: Palette,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
} as const;

export const REGISTRY_URL =
  "https://raw.githubusercontent.com/kubestellar/console-marketplace/main/registry.json";

export const CONSOLE_DEFAULT_PORT = 8080;
export const CONSOLE_DETECT_TIMEOUT = 3000;

export async function detectConsole(port = CONSOLE_DEFAULT_PORT): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONSOLE_DETECT_TIMEOUT);
    await fetch(`http://localhost:${port}/`, {
      mode: "no-cors",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}
