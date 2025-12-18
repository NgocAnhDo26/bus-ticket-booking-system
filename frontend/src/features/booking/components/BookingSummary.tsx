import { Bus, Calendar, Clock, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Trip } from '@/features/catalog/types';

import type { PassengerInfo } from '../types';

type BookingSummaryProps = {
    trip: Trip;
    passengers: PassengerInfo[];
    totalPrice: number;
};

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
}

export function BookingSummary({ trip, passengers, totalPrice }: BookingSummaryProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    Chi tiết chuyến xe
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Route Info */}
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <div className="w-0.5 h-8 bg-gray-200" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div>
                                <p className="font-medium">{trip.route.originStation.name}</p>
                                <p className="text-sm text-muted-foreground">{trip.route.originStation.city}</p>
                            </div>
                            <div>
                                <p className="font-medium">{trip.route.destinationStation.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {trip.route.destinationStation.city}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Time Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Ngày đi</p>
                            <p className="font-medium">{formatDate(trip.departureTime)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Giờ khởi hành</p>
                            <p className="font-medium">{formatTime(trip.departureTime)}</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Bus Info */}
                <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">Nhà xe</p>
                        <p className="font-medium">{trip.bus.operator.name}</p>
                    </div>
                </div>

                <Separator />

                {/* Passengers Summary */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">Hành khách ({passengers.length})</p>
                    </div>
                    <div className="space-y-2">
                        {passengers.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {p.seatCode}
                  </span>
                                    <span className="text-sm">{p.passengerName || 'Chưa nhập'}</span>
                                </div>
                                <span className="text-sm font-medium">{formatCurrency(p.price)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold">Tổng tiền</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
                </div>
            </CardContent>
        </Card>
    );
}
