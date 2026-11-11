import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook to enforce single active session per user across browser tabs.
 * Uses BroadcastChannel with localStorage storage event as fallback.
 */
export function useSingleTabSession(username) {
  const tabIdRef = useRef(
    typeof window !== 'undefined'
      ? `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      : 'tab_init'
  );
  const tabId = tabIdRef.current;
  const [isDuplicateTab, setIsDuplicateTab] = useState(false);

  const claimActiveTab = useCallback(() => {
    if (!username) return;
    setIsDuplicateTab(false);

    const payload = {
      type: 'CLAIM_ACTIVE_TAB',
      tabId,
      username: username.toLowerCase(),
      timestamp: Date.now(),
    };

    // 1. BroadcastChannel (primary)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('xiangqi_active_tab_channel');
        bc.postMessage(payload);
        bc.close();
      }
    } catch {
      // ignore
    }

    // 2. localStorage fallback for cross-window / browser events
    try {
      localStorage.setItem('xiangqi_active_tab_event', JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [username, tabId]);

  useEffect(() => {
    if (!username) {
      setIsDuplicateTab(false);
      return undefined;
    }

    // Immediately claim this tab upon mount or user change
    claimActiveTab();

    const handleSessionMsg = (data) => {
      if (!data || data.type !== 'CLAIM_ACTIVE_TAB') return;
      if (
        data.username === username.toLowerCase() &&
        data.tabId !== tabId
      ) {
        setIsDuplicateTab(true);
      }
    };

    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('xiangqi_active_tab_channel');
        bc.onmessage = (event) => {
          handleSessionMsg(event.data);
        };
      }
    } catch {
      // ignore
    }

    const handleStorageEvent = (event) => {
      if (event.key === 'xiangqi_active_tab_event' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          handleSessionMsg(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (bc) {
        try {
          bc.close();
        } catch {
          // ignore
        }
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [username, tabId, claimActiveTab]);

  return {
    tabId,
    isDuplicateTab,
    claimActiveTab,
    setIsDuplicateTab,
  };
}

