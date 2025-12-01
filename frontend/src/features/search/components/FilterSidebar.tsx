import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize from URL params using useMemo instead of useEffect
  const initialPriceRange = useMemo(() => {
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 0;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 2000000;
    return [minPrice, maxPrice];
  }, [searchParams]);

  // State for filters
  const [priceRange, setPriceRange] = useState(initialPriceRange);

  const handleApplyFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("minPrice", priceRange[0].toString());
    newParams.set("maxPrice", priceRange[1].toString());
    
    setSearchParams(newParams);
  };

  const timeRanges = [
    { id: "morning", label: "Sáng (00:00 - 12:00)" },
    { id: "afternoon", label: "Chiều (12:00 - 18:00)" },
    { id: "evening", label: "Tối (18:00 - 24:00)" },
  ];

  return (
    <div className="w-full md:w-64 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Bộ lọc tìm kiếm</h3>
            <Button variant="ghost" size="sm" onClick={handleApplyFilters}>Áp dụng</Button>
        </div>
        
        <div className="space-y-6">
            {/* Price Filter */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium">Giá vé</h4>
                <Slider
                    defaultValue={[0, 2000000]}
                    max={2000000}
                    step={50000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Intl.NumberFormat("vi-VN").format(priceRange[0])}đ</span>
                    <span>{new Intl.NumberFormat("vi-VN").format(priceRange[1])}đ</span>
                </div>
            </div>

            {/* Time Filter */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium">Giờ đi</h4>
                {timeRanges.map((time) => (
                    <div key={time.id} className="flex items-center space-x-2">
                        <Checkbox id={time.id} />
                        <Label htmlFor={time.id} className="text-sm font-normal">
                            {time.label}
                        </Label>
                    </div>
                ))}
            </div>

            {/* Operator Filter - This should ideally come from API */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium">Nhà xe</h4>
                <div className="flex items-center space-x-2">
                    <Checkbox id="op1" />
                    <Label htmlFor="op1" className="text-sm font-normal">Phương Trang</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="op2" />
                    <Label htmlFor="op2" className="text-sm font-normal">Thành Bưởi</Label>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
