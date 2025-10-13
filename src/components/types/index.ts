// Icon component interface
export interface IconProps {
  type: string;
  className?: string;
}

// Card theme configuration interface
export interface CardTheme {
  iconBg: string;
  borderColor: string;
  borderHover: string;
  shadowHover: string;
}

// Card component interface
export interface CardProps {
  icon: string;
  title: string;
  description: string;
  theme: string;
  className?: string;
}
