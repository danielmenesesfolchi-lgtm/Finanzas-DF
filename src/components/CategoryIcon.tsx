import React from "react";
import {
  Utensils,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Home,
  Car,
  Wrench,
  Gamepad2,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Bell,
  Sparkle,
  Info,
  ExternalLink,
  ChevronDown,
  Calendar,
  ListFilter,
  PiggyBank,
  RefreshCw
} from "lucide-react";

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = "", size = 20 }) => {
  switch (name) {
    case "Comida":
      return <Utensils className={className} size={size} />;
    case "Educación":
      return <GraduationCap className={className} size={size} />;
    case "Salud":
      return <HeartPulse className={className} size={size} />;
    case "Higiene":
      return <Sparkles className={className} size={size} />;
    case "Vivienda":
      return <Home className={className} size={size} />;
    case "Transporte":
      return <Car className={className} size={size} />;
    case "Servicios":
      return <Wrench className={className} size={size} />;
    case "Entretenimiento":
      return <Gamepad2 className={className} size={size} />;
    case "Otros":
    default:
      return <HelpCircle className={className} size={size} />;
  }
};

export {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  Bell,
  Sparkle,
  Info,
  ExternalLink,
  ChevronDown,
  Calendar,
  ListFilter,
  PiggyBank,
  RefreshCw
};
