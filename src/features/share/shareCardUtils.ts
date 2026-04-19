import { format } from 'date-fns';
import { ja as jaLocale, enUS } from 'date-fns/locale';
import { BADGES } from '../../data/badges';

export interface ShareCardActivity {
  name: string;
  duration: number;
  calories: number;
}

export interface ShareCardData {
  activities: ShareCardActivity[];
  totalCalories: number;
  totalSteps: number;
  comment: string;
  imageUrls: string[];
  streak: number;
  displayBadges: string[];
}

export function formatTotalDuration(activities: ShareCardActivity[]): number {
  return activities.reduce((sum, act) => sum + (act.duration || 0), 0);
}

export function getTopActivities(activities: ShareCardActivity[], max = 3): ShareCardActivity[] {
  return activities.slice(0, max);
}

export function getBadgeEmojis(badgeIds: string[]): string[] {
  return badgeIds
    .map(id => BADGES.find(b => b.id === id)?.icon)
    .filter((icon): icon is string => Boolean(icon));
}

export function formatShareDate(lang: 'ja' | 'en'): string {
  const now = new Date();
  if (lang === 'ja') {
    return format(now, 'M月d日', { locale: jaLocale });
  }
  return format(now, 'MMM d', { locale: enUS });
}
