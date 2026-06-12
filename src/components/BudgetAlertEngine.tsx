import { useEffect, useRef } from 'react';
import { useVantiStore } from '../store/vantiStore';

export function BudgetAlertEngine() {
  const stats = useVantiStore((state) => ({ total: 5200 })); // Simulated stats access - REAL implementation needs stats derivation
  const budget = 5000;
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const usage = stats.total / budget;

    if (usage >= 0.8 && !hasTriggeredRef.current) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 400]);
        }
        // Assuming ToastMessage is accessible or via store
        // Need to find Toast message setter in VantiStore or handle globally
        hasTriggeredRef.current = true;
    }
  }, [stats.total]);

  return null;
}
