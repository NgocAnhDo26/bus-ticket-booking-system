import { useCallback, useEffect } from 'react';

import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import SockJS from 'sockjs-client';

import type { TripStatusMessage } from '@/features/booking/types';
import { useAuthStore } from '@/store/auth-store';

const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
  return apiUrl.replace(/\/api\/?$/, '');
};

export type TripStatusCallback = (statusUpdate: TripStatusMessage) => void;

/**
 * Hook to subscribe to trip status updates for the current user.
 * Listens to `/topic/user/{userId}/trips` for real-time trip status changes.
 *
 * @param onStatusUpdate - Optional callback when a trip status update is received
 */
export const useTripStatusUpdates = (onStatusUpdate?: TripStatusCallback) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const handleStatusUpdate = useCallback(
    (statusUpdate: TripStatusMessage) => {
      // Invalidate bookings query to refresh list
      queryClient.invalidateQueries({
        queryKey: ['bookings'],
      });

      // Also invalidate any specific trip queries
      queryClient.invalidateQueries({
        queryKey: ['trip', statusUpdate.tripId],
      });

      // Call custom callback if provided
      if (onStatusUpdate) {
        onStatusUpdate(statusUpdate);
      }

      // Log the update
      console.log('Trip status update received:', statusUpdate);
    },
    [queryClient, onStatusUpdate],
  );

  useEffect(() => {
    if (!user?.id) return;

    // Setup global window object for SockJS compatibility
    if (typeof window !== 'undefined' && !(window as unknown as { global: Window }).global) {
      (window as unknown as { global: Window }).global = window;
    }

    const socketUrl = `${getBaseUrl()}/ws`;
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Connected to trip status WebSocket');

        client.subscribe(`/topic/user/${user.id}/trips`, (message: { body: string }) => {
          try {
            const statusUpdate: TripStatusMessage = JSON.parse(message.body);
            handleStatusUpdate(statusUpdate);
          } catch (error) {
            console.error('Failed to parse trip status message:', error);
          }
        });
      },
      onStompError: (frame: { headers: Record<string, string>; body: string }) => {
        console.error('Trip status WebSocket error:', frame.headers['message']);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [user?.id, handleStatusUpdate]);
};
