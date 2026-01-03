import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel, FieldTitle } from '@/components/ui/field';
import { Slider } from '@/components/ui/slider';
import { useOperators } from '@/features/catalog/hooks';
import { cn } from '@/lib/utils';

export const FilterSidebar = ({ className }: { className?: string }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: operators } = useOperators();

  // Initialize from URL params using useMemo instead of useEffect
  const initialPriceRange = useMemo(() => {
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 2000000;
    return [minPrice, maxPrice];
  }, [searchParams]);

  // Initialize time filters from URL
  const initialTimeFilters = useMemo(() => {
    const minTime = searchParams.get('minTime');
    const maxTime = searchParams.get('maxTime');
    const filters: string[] = [];

    // Simple mapping back to checkboxes (approximate)
    if (minTime === '00:00:00' && maxTime === '12:00:00') filters.push('morning');
    if (minTime === '12:00:00' && maxTime === '18:00:00') filters.push('afternoon');
    if (minTime === '18:00:00' && maxTime === '23:59:59') filters.push('evening');
    // If range covers multiple, we might check all (simplified)
    if (minTime === '00:00:00' && maxTime === '23:59:59')
      return ['morning', 'afternoon', 'evening'];

    return filters;
  }, [searchParams]);

  // Initialize operator filters from URL
  const initialOperatorFilters = useMemo(() => {
    const ops = searchParams.getAll('operatorIds');
    return ops;
  }, [searchParams]);

  // State for filters
  const [priceRange, setPriceRange] = useState(initialPriceRange);
  const [selectedTimes, setSelectedTimes] = useState<string[]>(initialTimeFilters);
  const [selectedOperators, setSelectedOperators] = useState<string[]>(initialOperatorFilters);

  const handleTimeChange = (timeId: string, checked: boolean) => {
    setSelectedTimes((prev) => (checked ? [...prev, timeId] : prev.filter((id) => id !== timeId)));
  };

  const handleOperatorChange = (opId: string, checked: boolean) => {
    setSelectedOperators((prev) => (checked ? [...prev, opId] : prev.filter((id) => id !== opId)));
  };

  const handleApplyFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('minPrice', priceRange[0].toString());
    newParams.set('maxPrice', priceRange[1].toString());

    // Calculate min/max time based on selected ranges
    let minT = '23:59:59';
    let maxT = '00:00:00';
    let hasTime = false;

    if (selectedTimes.includes('morning')) {
      if ('00:00:00' < minT) minT = '00:00:00';
      if ('12:00:00' > maxT) maxT = '12:00:00';
      hasTime = true;
    }
    if (selectedTimes.includes('afternoon')) {
      if ('12:00:00' < minT) minT = '12:00:00';
      if ('18:00:00' > maxT) maxT = '18:00:00';
      hasTime = true;
    }
    if (selectedTimes.includes('evening')) {
      if ('18:00:00' < minT) minT = '18:00:00';
      if ('23:59:59' > maxT) maxT = '23:59:59';
      hasTime = true;
    }

    if (hasTime) {
      newParams.set('minTime', minT);
      newParams.set('maxTime', maxT);
    } else {
      newParams.delete('minTime');
      newParams.delete('maxTime');
    }

    // Operator params
    newParams.delete('operatorIds');
    selectedOperators.forEach((opId) => newParams.append('operatorIds', opId));

    setSearchParams(newParams);
  };

  const timeRanges = [
    { id: 'morning', label: 'Sáng (00:00 - 12:00)' },
    { id: 'afternoon', label: 'Chiều (12:00 - 18:00)' },
    { id: 'evening', label: 'Tối (18:00 - 24:00)' },
  ];

  return (
    <div className={cn('w-full md:w-1/4', className)}>
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc tìm kiếm</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" onClick={handleApplyFilters}>
              Áp dụng
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            {/* Price Filter */}
            <Field>
              <FieldTitle>Giá vé</FieldTitle>
              <Slider
                defaultValue={[0, 2000000]}
                max={2000000}
                step={50000}
                value={priceRange}
                onValueChange={setPriceRange}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Intl.NumberFormat('vi-VN').format(priceRange[0])}đ</span>
                <span>{new Intl.NumberFormat('vi-VN').format(priceRange[1])}đ</span>
              </div>
            </Field>

            {/* Time Filter */}
            <Field>
              <FieldTitle>Giờ đi</FieldTitle>
              <FieldGroup className="gap-4">
                {timeRanges.map((time) => (
                  <Field key={time.id} orientation="horizontal">
                    <Checkbox
                      id={time.id}
                      checked={selectedTimes.includes(time.id)}
                      onCheckedChange={(checked) => handleTimeChange(time.id, checked as boolean)}
                    />
                    <FieldLabel htmlFor={time.id} className="font-normal">
                      {time.label}
                    </FieldLabel>
                  </Field>
                ))}
              </FieldGroup>
            </Field>

            {/* Operator Filter */}
            <Field>
              <FieldTitle>Nhà xe</FieldTitle>
              <FieldGroup className="gap-4">
                {operators?.map((op) => (
                  <Field key={op.id} orientation="horizontal">
                    <Checkbox
                      id={op.id}
                      checked={selectedOperators.includes(op.id)}
                      onCheckedChange={(checked) => handleOperatorChange(op.id, checked as boolean)}
                    />
                    <FieldLabel htmlFor={op.id} className="font-normal">
                      {op.name}
                    </FieldLabel>
                  </Field>
                ))}
              </FieldGroup>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
};
