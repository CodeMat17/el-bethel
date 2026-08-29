import {
  Activity, Banknote, CalendarX, CircleAlert, CircleCheck, ClipboardPen, Coins, Gauge, HandCoins, Landmark, Layers, Mail, MessageCircle, Percent, PieChart, Send, Signal, TrendingUp, Truck, UserCheck, UserPlus, Wallet, Wrench, 
  Award, Baby, Backpack, BadgeCheck, Bell, BookMarked, BookOpen, BookOpenCheck, Briefcase,
  Building2, Bus, CalendarCheck, CalendarDays, CalendarPlus, CalendarRange, ChartColumn,
  CircleDot, CircleHelp, ClipboardCheck, ClipboardList, Clock, Compass, Cpu, CreditCard, 
  FileCheck, FileText, FlaskConical, FolderOpen, Goal, GraduationCap, Heart, HeartHandshake,
  House, Images, Inbox, LayoutDashboard, Library, Lightbulb, ListChecks, MapPin, Megaphone,
  MessageSquareQuote, MessagesSquare, MonitorPlay, Music, Newspaper, Palette, PenLine, PenSquare,
  Phone, Puzzle, Receipt, School, ScrollText, Search, Settings, Shield, ShieldCheck, Sparkles,
  Sprout, Star, Stethoscope, Telescope, Timer, ToyBrick, Trophy, UserRound, Users,
  UtensilsCrossed, Volleyball,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Activity, Banknote, CalendarX, CircleAlert, CircleCheck, ClipboardPen, Coins, Gauge, HandCoins, Landmark, Layers, Mail, MessageCircle, Percent, PieChart, Send, Signal, TrendingUp, Truck, UserCheck, UserPlus, Wallet, Wrench,
  Award, Baby, Backpack, BadgeCheck, Bell, BookMarked, BookOpen, BookOpenCheck, Briefcase,
  Building2, Bus, CalendarCheck, CalendarDays, CalendarPlus, CalendarRange, ChartColumn,
  CircleDot, CircleHelp, ClipboardCheck, ClipboardList, Clock, Compass, Cpu, CreditCard, 
  FileCheck, FileText, FlaskConical, FolderOpen, Goal, GraduationCap, Heart, HeartHandshake,
  House, Images, Inbox, LayoutDashboard, Library, Lightbulb, ListChecks, MapPin, Megaphone,
  MessageSquareQuote, MessagesSquare, MonitorPlay, Music, Newspaper, Palette, PenLine, PenSquare,
  Phone, Puzzle, Receipt, School, ScrollText, Search, Settings, Shield, ShieldCheck, Sparkles,
  Sprout, Star, Stethoscope, Telescope, Timer, ToyBrick, Trophy, UserRound, Users,
  UtensilsCrossed, Volleyball,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Component = ICONS[name] ?? Sparkles;
  return <Component className={className} aria-hidden />;
}
