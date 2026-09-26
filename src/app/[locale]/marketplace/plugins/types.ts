export interface Plugin {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  longDescription: string;
  icon: string;
  category: string;
  pricing: {
    type: "free" | "monthly" | "one-time";
    amount?: number;
  };
  author: string;
  downloads: number;
  rating: number;
  version: string;
  features: string[];
  requirements: string[];
  compatibility: string[];
  screenshots: string[];
  documentation: string;
  github?: string;
  website?: string;
  tags: string[];
}
