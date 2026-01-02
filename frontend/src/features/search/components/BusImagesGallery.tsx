import { useState } from 'react';

import { Image } from 'lucide-react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { getImageUrl } from '@/lib/image-upload';

interface BusImagesGalleryProps {
  images?: string[];
}

export const BusImagesGallery = ({ images = [] }: BusImagesGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          <div className="text-center text-muted-foreground">
            <Image className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Chưa có hình ảnh</p>
            <p className="text-sm">Xe này chưa có hình ảnh được tải lên</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];
  const imageUrl = selectedImage ? getImageUrl(selectedImage) : '';

  return (
    <div className="space-y-4">
      {/* Large preview image */}
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
        {selectedImage ? (
          <img
            src={imageUrl}
            alt={`Bus image ${selectedIndex + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-center text-muted-foreground">
            <Image className="h-16 w-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Hình ảnh xe</p>
            <p className="text-sm">(Chọn hình ảnh bên dưới)</p>
          </div>
        )}
      </div>

      {/* Thumbnail carousel */}
      {images.length > 1 && (
        <Carousel className="w-full px-12">
          <CarouselContent className="-ml-2">
            {images.map((image, index) => {
              const thumbUrl = getImageUrl(image);
              return (
                <CarouselItem key={index} className="pl-2 basis-1/4 md:basis-1/5">
                  <div
                    className={`aspect-video rounded-md cursor-pointer border-2 transition-colors overflow-hidden ${
                      selectedIndex === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <img
                      src={thumbUrl}
                      alt={`Bus thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="-left-0" />
          <CarouselNext className="-right-0" />
        </Carousel>
      )}
    </div>
  );
};
