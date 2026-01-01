import { Image } from 'lucide-react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface BusImagesGalleryProps {
  // TODO: Add images prop when implementing actual bus images
  images?: string[];
}

export const BusImagesGallery = ({ images = [] }: BusImagesGalleryProps) => {
  // Placeholder data for now
  const placeholderCount = images.length > 0 ? images.length : 5;

  return (
    <div className="space-y-4">
      {/* Large preview image */}
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
        {/* Replace with actual selected image */}
        <div className="text-center text-muted-foreground">
          <Image className="h-16 w-16 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">Hình ảnh xe</p>
          <p className="text-sm">(Chọn hình ảnh bên dưới)</p>
        </div>
      </div>

      {/* Thumbnail carousel */}
      <Carousel className="w-full px-12">
        <CarouselContent className="-ml-2">
          {/* Placeholder thumbnails - replace with actual bus images */}
          {Array.from({ length: placeholderCount }, (_, index) => (
            <CarouselItem key={index} className="pl-2 basis-1/4 md:basis-1/5">
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center cursor-pointer border-2 border-transparent hover:border-primary transition-colors overflow-hidden">
                <div className="text-center text-muted-foreground">
                  <Image className="h-6 w-6 mx-auto opacity-50" />
                  <p className="text-xs mt-1">{index + 1}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-0" />
        <CarouselNext className="-right-0" />
      </Carousel>
    </div>
  );
};
