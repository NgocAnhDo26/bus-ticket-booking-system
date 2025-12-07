import { create } from "zustand";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { bookingApi } from "./api";
import { type SeatStatusMessage } from "./types";
import { useAuthStore } from "@/store/auth-store";

const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

type BookingState = {
  tripId: string | null;
  seatStatusMap: Record<string, string>; // seatCode -> statusString
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: (tripId: string) => Promise<void>;
  cleanup: () => void;
  toggleSeat: (seatCode: string) => Promise<void>;
};

export const useBookingStore = create<BookingState>((set, get) => {
  let stompClient: Client | null = null;

  return {
    tripId: null,
    seatStatusMap: {},
    isConnected: false,
    isLoading: false,
    error: null,

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
            
            stompClient?.subscribe(`/topic/trip/${tripId}/seats`, (message) => {
              const body: SeatStatusMessage = JSON.parse(message.body);
              const { seatCode, status, lockedByUserId } = body;
              
              set((state) => {
                const newMap = { ...state.seatStatusMap };
                if (status === "AVAILABLE") {
                  delete newMap[seatCode];
                } else if (status === "LOCKED") {
                  newMap[seatCode] = `LOCKED:${lockedByUserId}`;
                } else if (status === "BOOKED") {
                  newMap[seatCode] = "BOOKED";
                }
                return { seatStatusMap: newMap };
              });
            });
          },
          onStompError: (frame) => {
            console.error("Broker reported error: " + frame.headers["message"]);
            console.error("Additional details: " + frame.body);
          },
        });

        stompClient.activate();
      } catch (err) {
        set({ error: "Failed to initialize booking session" });
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
        error: null 
      });
    },

    toggleSeat: async (seatCode: string) => {
      const { tripId, seatStatusMap } = get();
      if (!tripId) return;

      const user = useAuthStore.getState().user;
      if (!user) return;

      const currentStatus = seatStatusMap[seatCode];
      const isMyLock = currentStatus === `LOCKED:${user.id}`;
      const isAvailable = !currentStatus;

      try {
        if (isMyLock) {
          // Unlock
          await bookingApi.unlockSeat({ tripId, seatCode });
          // Optimistic update handled by WS usually, but we can do it here too if latency is high
          // But with WS it's safer to wait for confirmation to avoid desync
        } else if (isAvailable) {
          // Lock
          await bookingApi.lockSeat({ tripId, seatCode });
        }
      } catch (err) {
        console.error("Failed to toggle seat", err);
        // Optionally set error state
      }
    },
  };
});

