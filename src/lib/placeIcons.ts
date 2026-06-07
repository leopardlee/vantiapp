export function getEmojiForPlace(types: string[] = [], name: string = ''): string {
  const t = types.join(' ').toLowerCase();
  const n = name.toLowerCase();
  
  if (t.includes('restaurant') || t.includes('food') || n.includes('restaurant') || n.includes('eats')) return '🍽️';
  if (t.includes('cafe') || t.includes('coffee') || n.includes('cafe') || n.includes('coffee')) return '☕';
  if (t.includes('bar') || t.includes('pub') || t.includes('night') || n.includes('bar') || n.includes('pub')) return '🍸';
  if (t.includes('park') || t.includes('nature') || n.includes('park')) return '🌳';
  if (t.includes('museum') || t.includes('art') || n.includes('museum') || n.includes('gallery')) return '🏛️';
  if (t.includes('store') || t.includes('shopping') || n.includes('shop') || n.includes('mall')) return '🛍️';
  if (t.includes('lodging') || t.includes('hotel') || n.includes('hotel') || n.includes('resort')) return '🏨';
  if (t.includes('beach') || n.includes('beach')) return '🏖️';
  if (t.includes('mountain') || n.includes('mountain') || n.includes('peak')) return '⛰️';
  if (t.includes('airport') || n.includes('airport')) return '✈️';
  if (t.includes('train') || t.includes('transit') || n.includes('station')) return '🚆';
  if (t.includes('hospital') || t.includes('health') || n.includes('hospital')) return '🏥';
  if (n.includes('diary') || n.includes('journal') || n.includes('memory')) return '📖';
  
  return '📍';
}
