// Click Win useReferral Hook
// Checks URL for ?ref= param, stores in localStorage, exposes referral code

import { useCallback, useEffect, useState } from 'react';

const REFERRAL_STORAGE_KEY = 'clickwin_referral_code';

interface UseReferralReturn {
  referralCode: string | null;
  hasReferral: boolean;
  clearReferralCode: () => void;
}

export function useReferral(): UseReferralReturn {
  const [referralCode, setReferralCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  });

  // On mount, check URL for ?ref= param
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');

    if (refParam && /^[A-Z0-9]{6}$/.test(refParam.toUpperCase())) {
      const code = refParam.toUpperCase();
      localStorage.setItem(REFERRAL_STORAGE_KEY, code);
      setReferralCode(code);

      // Clean URL without reload (remove ref param)
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const clearReferralCode = useCallback(() => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    setReferralCode(null);
  }, []);

  return {
    referralCode,
    hasReferral: !!referralCode,
    clearReferralCode,
  };
}
