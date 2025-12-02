import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { useOperators } from "@/features/catalog/hooks";

export const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: operators } = useOperators();
  
  // Initialize from URL params using useMemo instead of useEffect
  const initialPriceRange = useMemo(() => {
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 0;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 2000000;
    return [minPrice, maxPrice];
  }, [searchParams]);

  // Initialize time filters from URL
  const initialTimeFilters = useMemo(() => {
    const minTime = searchParams.get("minTime");
    const maxTime = searchParams.get("maxTime");
    const filters: string[] = [];
    
    // Simple mapping back to checkboxes (approximate)
    if (minTime === "00:00:00" && maxTime === "12:00:00") filters.push("morning");
    if (minTime === "12:00:00" && maxTime === "18:00:00") filters.push("afternoon");
    if (minTime === "18:00:00" && maxTime === "23:59:59") filters.push("evening");
    // If range covers multiple, we might check all (simplified)
    if (minTime === "00:00:00" && maxTime === "23:59:59") return ["morning", "afternoon", "evening"];
    
    return filters;
  }, [searchParams]);

  // Initialize operator filters from URL
  const initialOperatorFilters = useMemo(() => {
    const ops = searchParams.getAll("operatorIds");
    return ops;
  }, [searchParams]);

  // State for filters
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(initialTimeFilters);
  const [selectedOperators, setSelectedOperators] = useState<string[]>(initialOperatorFilters);

  const handleTimeChange = (timeId: string, checked: boolean) => {
    setSelectedTimes(prev => 
      checked ? [...prev, timeId] : prev.filter(id => id !== timeId)
    );
  };

  const handleOperatorChange = (opId: string, checked: boolean) => {
    setSelectedOperators(prev => 
      checked ? [...prev, opId] : prev.filter(id => id !== opId)
    );
  };

  const handleApplyFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("minPrice", priceRange[0].toString());
    newParams.set("maxPrice", priceRange[1].toString());
    
    // Calculate min/max time based on selected ranges
    let minT = "23:59:59";
    let maxT = "00:00:00";
    let hasTime = false;

    if (selectedTimes.includes("morning")) {
        if ("00:00:00" < minT) minT = "00:00:00";
        if ("12:00:00" > maxT) maxT = "12:00:00";
        hasTime = true;
    }
    if (selectedTimes.includes("afternoon")) {
        if ("12:00:00" < minT) minT = "12:00:00";
        if ("18:00:00" > maxT) maxT = "18:00:00";
        hasTime = true;
    }
    if (selectedTimes.includes("evening")) {
        if ("18:00:00" < minT) minT = "18:00:00";
        if ("23:59:59" > maxT) maxT = "23:59:59";
        hasTime = true;
    }

    if (hasTime) {
        newParams.set("minTime", minT);
        newParams.set("maxTime", maxT);
    } else {
        newParams.delete("minTime");
        newParams.delete("maxTime");
    }

    // Operator params
    newParams.delete("operatorIds");
    selectedOperators.forEach(opId => newParams.append("operatorIds", opId));
    
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
                        <Checkbox 
                            id={time.id} 
                            checked={selectedTimes.includes(time.id)}
                            onCheckedChange={(checked) => handleTimeChange(time.id, checked as boolean)}
                        />
                        <Label htmlFor={time.id} className="text-sm font-normal">
                            {time.label}
                        </Label>
                    </div>
                ))}
            </div>

            {/* Operator Filter */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium">Nhà xe</h4>
                {operators?.map((op) => (
                    <div key={op.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={op.id} 
                            checked={selectedOperators.includes(op.id)}
                            onCheckedChange={(checked) => handleOperatorChange(op.id, checked as boolean)}
                        />
                        <Label htmlFor={op.id} className="text-sm font-normal">{op.name}</Label>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
