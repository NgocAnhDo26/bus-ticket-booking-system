import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useAuthStore } from '@/store/auth-store';

import { bookingApi } from './api';
import { type LockSeatRequest, type SeatStatusMessage } from './types';

const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
  return apiUrl.replace(/\/api\/?$/, '');
};

type BookingState = {
  tripId: string | null;
  seatStatusMap: Record<string, string>; // seatCode -> statusString
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Draft / Pending State (for restoring when going back)
  pendingBookingId: string | null;
  pendingSelectedSeats: string[];

  // User's current session selection (explicit list of seat codes)
  selectedSeats: string[];

  // Actions
  initialize: (tripId: string) => Promise<void>;
  cleanup: () => void;
  toggleSeat: (seatCode: string) => Promise<void>;
  setPendingBooking: (id: string | null, seats: string[]) => void;
  pickupStationId: string | null;
  dropoffStationId: string | null;
  setPickupStationId: (id: string | null) => void;
  setDropoffStationId: (id: string | null) => void;
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => {
      let stompClient: Client | null = null;

      return {
        tripId: null,
        seatStatusMap: {},
        isConnected: false,
        isLoading: false,
        error: null,
        pendingBookingId: null,
        pendingSelectedSeats: [],
        selectedSeats: [],

        setPendingBooking: (id, seats) =>
          set({ pendingBookingId: id, pendingSelectedSeats: seats }),

        pickupStationId: null,
        dropoffStationId: null,
        setPickupStationId: (id) => set({ pickupStationId: id }),
        setDropoffStationId: (id) => set({ dropoffStationId: id }),

        initialize: async (tripId: string) => {
          set({ tripId, isLoading: true, error: null });

          try {
            // 1. Load initial status
            const initialStatus = await bookingApi.getSeatStatus(tripId);
            set({ seatStatusMap: initialStatus });

            // 2. Connect WebSocket
            // In vite, if global variable 'global' is not defined, sockjs might fail.
            if (
              typeof window !== 'undefined' &&
              !(window as unknown as { global: Window }).global
            ) {
              (window as unknown as { global: Window }).global = window;
            }

            const socketUrl = `${getBaseUrl()}/ws`;

            stompClient = new Client({
              webSocketFactory: () => new SockJS(socketUrl),
              // debug: (str) => console.log(str),
              reconnectDelay: 5000,
              onConnect: () => {
                set({ isConnected: true });

                stompClient?.subscribe(
                  `/topic/trip/${tripId}/seats`,
                  (message: { body: string }) => {
                    const body: SeatStatusMessage = JSON.parse(message.body);
                    const { seatCode, status, lockedByUserId } = body;

                    set((state) => {
                      const newMap = { ...state.seatStatusMap };
                      if (status === 'AVAILABLE') {
                        delete newMap[seatCode];
                      } else if (status === 'LOCKED') {
                        newMap[seatCode] = `LOCKED:${lockedByUserId}`;
                      } else if (status === 'BOOKED') {
                        newMap[seatCode] = 'BOOKED';
                      }
                      return { seatStatusMap: newMap };
                    });
                  },
                );
              },
              onStompError: (frame: { headers: Record<string, string>; body: string }) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
              },
            });

            stompClient.activate();
          } catch (err) {
            set({ error: 'Failed to initialize booking session' });
            console.error(err);
          } finally {
            set({ isLoading: false });
          }
        },

        cleanup: () => {
          if (stompClient) {
            stompClient.deactivate();
            stompClient = null;
          }
          // Don't clear pendingBookingId here if we want to persist it across refreshing
          // But if we want to clear session state, we might specific actions.
          // For now, let's keep basic cleanup but maybe preserve pendingBookingId?
          // The persisted state is handled by middleware.
          // If we set everything to null here, it updates store -> updates localstorage -> clears it.
          // The goal is to KEEP pendingBookingId when navigating or refreshing.
          // But `cleanup` is called on unmount.
          // If we unmount BookingPage, do we want to clear?
          // User wants "Back" to work.
          // If "Back" unmounts BookingPage, and cleanup runs, data is lost.
          // WE SHOULD REMOVE cleanup call from BookingPage unmount OR make cleanup less aggressive.

          set({
            tripId: null,
            seatStatusMap: {},
            isConnected: false,
            error: null,
            // Keep pendingBookingId and selectedSeats?
            // If we clear selectedSeats, we lose selection on Back.
            // So we should NOT clear selectedSeats here.
            // selectedSeats: [],
            // Also keep pickup/dropoff
          });
        },

        toggleSeat: async (seatCode: string) => {
          const { tripId, seatStatusMap, selectedSeats } = get();
          if (!tripId) return;

          const user = useAuthStore.getState().user;
          const currentStatus = seatStatusMap[seatCode];

          // Guest ID Logic: Get or Create
          let guestId = sessionStorage.getItem('guest_id');
          if (!user && !guestId) {
            guestId = crypto.randomUUID();
            sessionStorage.setItem('guest_id', guestId);
          }

          // Check ownership: Either explicitly in our selected list OR strictly by ID (fallback)
          const isMyLock =
            selectedSeats.includes(seatCode) ||
            (user
              ? currentStatus === `LOCKED:${user.id}`
              : guestId
                ? currentStatus === `LOCKED:${guestId}`
                : false);
          const isAvailable = !currentStatus || currentStatus === 'AVAILABLE';

          try {
            const payload: LockSeatRequest = { tripId, seatCode };
            if (!user && guestId) {
              payload.guestId = guestId;
            }

            if (isMyLock) {
              // Unlock
              await bookingApi.unlockSeat(payload);
              set({ selectedSeats: selectedSeats.filter((s) => s !== seatCode) });
            } else if (isAvailable) {
              // Lock
              await bookingApi.lockSeat(payload);
              set({ selectedSeats: [...selectedSeats, seatCode] });
            }
          } catch (err) {
            console.error('Failed to toggle seat', err);
          }
        },
      };
    },
    {
      name: 'booking-storage',
      partialize: (state) => ({
        // Note: seatStatusMap is NOT persisted - always fetch fresh from server
        pendingBookingId: state.pendingBookingId,
        pendingSelectedSeats: state.pendingSelectedSeats,
        // selectedSeats is NOT persisted to avoid showing stale selections across sessions
        tripId: state.tripId,
        pickupStationId: state.pickupStationId,
        dropoffStationId: state.dropoffStationId,
      }),
    },
  ),
);
