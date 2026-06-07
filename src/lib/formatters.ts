
/**
 * Utility for dynamic locale-based formatting.
 * Supports date, currency, and distance based on store state.
 */

export function formatDate(date: string | number | Date, language: 'en' | 'ko' = 'en'): string {
  const d = new Date(date);
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  
  // Use a more descriptive relative time for recent items if applicable
  const now = new Date();
  const diffInMs = Math.abs(now.getTime() - d.getTime());
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    if (language === 'ko') return '오늘';
    return 'Today';
  }
  if (diffInDays === 1) {
    if (language === 'ko') return '어제';
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  }).format(d);
}

export function formatCurrency(amount: number, language: 'en' | 'ko' = 'en'): string {
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const currency = language === 'ko' ? 'KRW' : 'USD';
  
  // For Korean won, we often don't show decimals and use different grouping
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: language === 'ko' ? 0 : 2,
    maximumFractionDigits: language === 'ko' ? 0 : 2,
    currencyDisplay: 'symbol'
  }).format(amount);
}

export function formatDistance(meters: number, units: 'metric' | 'imperial', language: 'en' | 'ko' = 'en'): string {
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  
  if (units === 'imperial') {
    const miles = meters / 1609.34;
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'mile',
      unitDisplay: 'short',
      maximumFractionDigits: 1
    }).format(miles);
  } else {
    const km = meters / 1000;
    if (km < 1) {
       return new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'meter',
        unitDisplay: 'short'
      }).format(meters);
    }
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'kilometer',
      unitDisplay: 'short',
      maximumFractionDigits: 1
    }).format(km);
  }
}
