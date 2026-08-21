import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getBusTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ordinary: "Ordinary",
    semi_luxury: "Semi-Luxury",
    luxury: "Luxury",
  };
  return labels[type] ?? type;
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "on_time": return "badge-success";
    case "delayed": return "badge-warning";
    case "cancelled": return "badge-error";
    case "early": return "badge-info";
    case "in_progress": return "badge-primary";
    default: return "badge-neutral";
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    on_time: "On Time",
    delayed: "Delayed",
    cancelled: "Cancelled",
    early: "Early",
    in_progress: "In Progress",
    scheduled: "Scheduled",
    completed: "Completed",
    open: "Open",
    resolved: "Resolved",
  };
  return labels[status] ?? status;
}

export function calcETA(scheduledArrival: string, delayMinutes: number): Date {
  const base = new Date(scheduledArrival);
  return new Date(base.getTime() + delayMinutes * 60000);
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
