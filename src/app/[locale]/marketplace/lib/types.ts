export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  author: string;
  authorGithub?: string;
  version: string;
  downloadUrl: string;
  tags: string[];
  cardCount: number;
  type: "dashboard" | "card-preset" | "theme";
  themeColors?: string[];
}

export interface RegistryData {
  version: string;
  updatedAt: string;
  items: MarketplaceItem[];
  presets?: MarketplaceItem[];
}

export type ConsoleStatus = "unknown" | "detecting" | "running" | "not-running";
