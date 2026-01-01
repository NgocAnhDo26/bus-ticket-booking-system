/**
 * Maps amenity label to Vietnamese
 * @param amenity - The amenity string (can be in English or Vietnamese)
 * @returns Vietnamese label for the amenity
 */
export const mapAmenityToVietnamese = (amenity: string): string => {
  const amenityMap: Record<string, string> = {
    // English to Vietnamese
    WiFi: 'WiFi miễn phí',
    Wifi: 'WiFi miễn phí',
    usb: 'Ổ cắm sạc',
    blanket: 'Chăn đắp',
    'Air Conditioning': 'Máy lạnh',
    'Air Conditioner': 'Máy lạnh',
    'Drinking Water': 'Nước uống miễn phí',
    'Free Water': 'Nước uống miễn phí',
    'TV Screen': 'TV màn hình',
    Television: 'TV màn hình',
    TV: 'TV màn hình',
    'Charging Port': 'Ổ cắm sạc',
    'Power Outlet': 'Ổ cắm sạc',
    'USB Charging': 'Ổ cắm sạc',
    'Cổng USB': 'Ổ cắm sạc',
    Insurance: 'Bảo hiểm hành khách',
    'Passenger Insurance': 'Bảo hiểm hành khách',
    Food: 'Đồ ăn',
    'Food Service': 'Đồ ăn',
    Meal: 'Đồ ăn',
    Toilet: 'Toilet',
    'Chăn đắp': 'Chăn đắp',
    // Vietnamese (already in Vietnamese, return as is or standardize)
    'Máy lạnh': 'Máy lạnh',
    'Nước uống': 'Nước uống miễn phí',
    'TV màn hình': 'TV màn hình',
    'Ổ cắm sạc': 'Ổ cắm sạc',
    'Bảo hiểm': 'Bảo hiểm hành khách',
    'Đồ ăn': 'Đồ ăn',
  };

  // Check if we have a direct mapping
  if (amenityMap[amenity]) {
    return amenityMap[amenity];
  }

  // Check case-insensitive match
  const normalizedAmenity = amenity.trim();
  const lowerCaseAmenity = normalizedAmenity.toLowerCase();

  for (const [key, value] of Object.entries(amenityMap)) {
    if (key.toLowerCase() === lowerCaseAmenity) {
      return value;
    }
  }

  // If no mapping found, return the original amenity
  return amenity;
};
