import { useMemo, useState, type ElementType } from "react";
import {
  Crown,
  Eraser,
  LifeBuoy,
  MousePointerSquareDashed,
  Square,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { type SeatType } from "@/features/catalog/types";
import { useShallow } from "zustand/react/shallow";
import { useBusLayoutStore } from "../store/useBusLayoutStore";
import { generateNextSeatCode, seatKey } from "../utils";
import { type SeatCell, type SeatTool } from "../types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const seatTypeStyles: Record<SeatType, string> = {
  NORMAL: "bg-emerald-500/80 border-emerald-600 text-white",
  VIP: "bg-amber-500/80 border-amber-600 text-white",
};

const tools: Array<{
  key: SeatTool;
  label: string;
  icon: ElementType;
  description?: string;
}> = [
  {
    key: "CURSOR",
    label: "Chỉnh sửa",
    icon: MousePointerSquareDashed,
    description: "Nhấp vào ghế để đổi mã hoặc loại ghế",
  },
  {
    key: "ERASER",
    label: "Xóa ghế",
    icon: Eraser,
    description: "Xóa ghế khỏi vị trí",
  },
  {
    key: "NORMAL",
    label: "Ghế thường",
    icon: Square,
    description: "Thêm ghế thường",
  },
  {
    key: "VIP",
    label: "Ghế VIP",
    icon: Crown,
    description: "Thêm ghế VIP",
  },
];

type SeatMapEditorProps = {
  className?: string;
};

export const SeatMapEditor = ({ className }: SeatMapEditorProps) => {
  const {
    config,
    gridDimensions,
    seats,
    selectedTool,
    setTool,
    addSeat,
    removeSeat,
    updateSeat,
    currentFloor,
    setCurrentFloor,
  } = useBusLayoutStore(
    useShallow((state) => ({
      config: state.config,
      gridDimensions: state.gridDimensions,
      seats: state.seats,
      selectedTool: state.selectedTool,
      setTool: state.setTool,
      addSeat: state.addSeat,
      removeSeat: state.removeSeat,
      updateSeat: state.updateSeat,
      currentFloor: state.currentFloor,
      setCurrentFloor: state.setCurrentFloor,
    })),
  );

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{
    seatCode: string;
    type: SeatType;
  }>({ seatCode: "", type: "NORMAL" });

  const seatMap = useMemo(() => {
    const map = new Map<string, SeatCell>();
    seats.forEach((seat) => {
      map.set(seatKey(seat.floor, seat.row, seat.col), seat);
    });
    return map;
  }, [seats]);

  const floors = useMemo(
    () => Array.from({ length: config.totalFloors }, (_, i) => i + 1),
    [config.totalFloors],
  );

  const handleCellClick = (row: number, col: number, floor: number) => {
    const key = seatKey(floor, row, col);
    const seat = seatMap.get(key);

    if (selectedTool === "ERASER") {
      removeSeat(row, col, floor);
      setEditingKey(null);
      return;
    }

    if (selectedTool === "CURSOR") {
      if (seat) {
        setEditingValues({ seatCode: seat.seatCode, type: seat.type });
        setEditingKey(key);
      }
      return;
    }

    const seatType = selectedTool as SeatType;
    const seatCode = seat?.seatCode ?? generateNextSeatCode(seats, col);
    addSeat({
      id: seat?.id,
      seatCode,
      type: seatType,
      floor,
      row,
      col,
    });
    setEditingKey(null);
  };

  const handleUpdateSeat = (seat: SeatCell) => {
    const safeCode = editingValues.seatCode.trim() || seat.seatCode;
    updateSeat({ ...seat, seatCode: safeCode, type: editingValues.type });
    setEditingKey(null);
  };

  const renderGrid = (floor: number) => (
    <div className="space-y-3 md:mt-4">
      <div className="flex justify-between">
        <div className="flex items-center justify-center gap-2">
          <Square className="text-emerald-500" />
          <p className="text-sm">Ghế thường</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Square className="text-amber-600" />
          <p className="text-sm">Ghế VIP</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Square className="text-muted-foreground" />
          <p className="text-sm">Ô trống</p>
        </div>
      </div>

      <div
        className="grid gap-2 rounded-lg border bg-background p-6 shadow-sm min-w-[320px]"
        style={{
          gridTemplateColumns: `repeat(${gridDimensions.cols}, minmax(52px, 1fr))`,
        }}
      >
        <div
          className="flex items-center justify-between mb-3"
          style={{ gridColumn: "1 / -1" }}
        >
          <div className="flex items-center justify-center ml-3">
            <LifeBuoy className="rotate-90" /> {/* Rotate steering wheel */}
          </div>
          <div className="flex items-center justify-center">
            <Badge className="bg-primary/10 text-primary">
              {seats.filter((s) => s.floor === floor).length} ghế
            </Badge>
          </div>
        </div>

        {Array.from({ length: gridDimensions.rows }).map((_, rowIdx) =>
          Array.from({ length: gridDimensions.cols }).map((__, colIdx) => {
            const key = seatKey(floor, rowIdx, colIdx);
            const seat = seatMap.get(key);
            const isEditing = editingKey === key;

            return (
              <Popover
                key={key}
                open={isEditing}
                onOpenChange={(open) => !open && setEditingKey(null)}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleCellClick(rowIdx, colIdx, floor)}
                    className={cn(
                      "flex h-14 w-full max-w-14 flex-col items-center justify-center rounded-md border text-xs transition-colors",
                      "mx-auto",
                      seat
                        ? (seatTypeStyles[seat.type] ??
                            "bg-indigo-500/80 border-indigo-700 text-white")
                        : "bg-muted/40 hover:bg-muted/60",
                      selectedTool === "ERASER"
                        ? "hover:border-destructive"
                        : "hover:border-primary",
                    )}
                  >
                    <span className="font-semibold">
                      {seat ? seat.seatCode : ""}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      C{colIdx + 1} • H{rowIdx + 1}
                    </span>
                  </button>
                </PopoverTrigger>
                {seat ? (
                  <PopoverContent className="w-64 space-y-3" align="center">
                    <div className="space-y-2">
                      <Label>Mã ghế</Label>
                      <Input
                        value={editingValues.seatCode}
                        onChange={(event) =>
                          setEditingValues((prev) => ({
                            ...prev,
                            seatCode: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Loại ghế</Label>
                      <Select
                        value={editingValues.type}
                        onValueChange={(value) =>
                          setEditingValues((prev) => ({
                            ...prev,
                            type: value as SeatType,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại ghế" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["NORMAL", "VIP"] satisfies SeatType[]).map(
                            (type) => {
                              const tool = tools.find((t) => t.key === type);
                              const ToolIcon = tool?.icon ?? Square;
                              const label = tool?.label ?? type;
                              return (
                                <SelectItem key={type} value={type}>
                                  <div className="flex items-center gap-2">
                                    <ToolIcon className="h-4 w-4" />
                                    <span>{label}</span>
                                  </div>
                                </SelectItem>
                              );
                            },
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end pt-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingKey(null)}
                      >
                        Đóng
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleUpdateSeat(seat)}
                      >
                        Cập nhật
                      </Button>
                    </div>
                  </PopoverContent>
                ) : null}
              </Popover>
            );
          }),
        )}
      </div>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bước 2/2: Vẽ sơ đồ ghế</CardTitle>
        <p className="text-sm text-muted-foreground">
          Chọn công cụ bên trái, nhấp vào ô để thêm, chỉnh sửa hoặc xóa ghế.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs
          value={`floor-${currentFloor}`}
          onValueChange={(value) => {
            const floor = Number(value.replace("floor-", ""));
            setCurrentFloor(floor);
          }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              {floors.map((floor) => (
                <TabsTrigger
                  key={floor}
                  value={`floor-${floor}`}
                  className="min-w-20"
                >
                  Tầng {floor}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="text-sm text-muted-foreground">
              Kích thước: {gridDimensions.rows} x {gridDimensions.cols}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Công cụ</p>
                <div className="grid grid-cols-2 gap-2">
                  {tools.map(({ key, label, icon: Icon, description }) => (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          key={key}
                          type="button"
                          variant={
                            selectedTool === key ? "secondary" : "outline"
                          }
                          className="h-auto justify-start py-3 font-normal"
                          onClick={() => setTool(key)}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-dashed bg-background p-3 text-sm text-muted-foreground">
                Mẹo: Dùng <span className="font-semibold">Con trỏ</span> để đổi
                mã ghế,
                <span className="font-semibold"> Tẩy</span> để xóa ghế.
              </div>
            </div>

            <div className="flex items-center justify-center">
              {floors.map((floor) => (
                <TabsContent
                  key={floor}
                  value={`floor-${floor}`}
                  className="mt-0"
                >
                  {renderGrid(floor)}
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
