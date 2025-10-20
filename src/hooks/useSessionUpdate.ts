import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to update session information after login
 * This ensures device and location information is captured
 *
 * @param rememberMe - Whether to extend session to 30 days
 */
export function useSessionUpdate(rememberMe?: boolean) {
  const { data: session, status } = useSession();
  const hasUpdated = useRef(false);

  useEffect(() => {
    // Only update once when session becomes authenticated
    if (status === 'authenticated' && session?.user && !hasUpdated.current) {
      hasUpdated.current = true;

      // Call the session update endpoint
      fetch('/api/auth/session/update', {
        method: 'POST',
      })
        .then((response) => {
          if (!response.ok) {
            console.error('Failed to update session information');
          }
          return response.json();
        })
        .then((data) => {
          if (data.isNewDevice) {
            console.log('New device detected - notification sent');
          }

          // Extend session if remember me is checked
          if (rememberMe) {
            return fetch('/api/auth/extend-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ rememberMe: true }),
            });
          }
        })
        .then((response) => {
          if (response && !response.ok) {
            console.error('Failed to extend session');
          }
        })
        .catch((error) => {
          console.error('Error updating session:', error);
        });
    }
  }, [status, session, rememberMe]);
}
