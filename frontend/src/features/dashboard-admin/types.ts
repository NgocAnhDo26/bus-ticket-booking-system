export type MetricsResponse = {
  todayRevenue: number;
  todayTicketsSold: number;
  todayNewUsers: number;
  todayActiveOperators: number;
};

export type RevenueChartResponse = {
  date: string;
  revenue: number;
};

export type TopRouteResponse = {
  routeId: string;
  origin: string;
  destination: string;
  ticketsSold: number;
};

export type TransactionResponse = {
  id: string;
  passengerName: string;
  route: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  bookingTime: string;
};

export type TopOperatorResponse = {
  operatorId: string;
  operatorName: string;
  ticketsSold: number;
  totalRevenue: number;
};
