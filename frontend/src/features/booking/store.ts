import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { create } from 'zustand';

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
};

export const useBookingStore = create<BookingState>((set, get) => {
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

    setPendingBooking: (id, seats) => set({ pendingBookingId: id, pendingSelectedSeats: seats }),

    initialize: async (tripId: string) => {
      set({ tripId, isLoading: true, error: null });

      try {
        // 1. Load initial status
        const initialStatus = await bookingApi.getSeatStatus(tripId);
        set({ seatStatusMap: initialStatus });

        // 2. Connect WebSocket
        // In vite, if global variable 'global' is not defined, sockjs might fail.
        if (typeof window !== 'undefined' && !(window as unknown as { global: Window }).global) {
          (window as unknown as { global: Window }).global = window;
        }

        const socketUrl = `${getBaseUrl()}/ws`;

        stompClient = new Client({
          webSocketFactory: () => new SockJS(socketUrl),
          // debug: (str) => console.log(str),
          reconnectDelay: 5000,
          onConnect: () => {
            set({ isConnected: true });

            stompClient?.subscribe(`/topic/trip/${tripId}/seats`, (message: { body: string }) => {
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
            });
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
      set({
        tripId: null,
        seatStatusMap: {},
        isConnected: false,
        error: null,
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
});
