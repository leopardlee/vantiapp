import React, { useState } from 'react';
import { AdvancedMarker, InfoWindow, Pin, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { Bookmark, Star, MapPin } from 'lucide-react';
import { useVantiStore } from '../store/vantiStore';

const BookmarkMarker = ({ place }: { place: any }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  const lat = typeof place.location?.lat === 'function' ? place.location.lat() : (place.location?.lat || place.lat);
  const lng = typeof place.location?.lng === 'function' ? place.location.lng() : (place.location?.lng || place.lng);

  if (!lat || !lng) return null;

  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        position={{ lat, lng }} 
        onClick={() => setOpen(true)}
        zIndex={100}
      >
        <div className="relative group/bookmark flex flex-col items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center relative drop-shadow-xl transition-all duration-300 group bg-amber-500 border-2 border-white shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                <Bookmark className="w-5 h-5 text-white fill-white" />
            </div>
            {/* Pointer Base */}
            <div className="absolute -bottom-1.5 w-3 h-3 rotate-45 border-r-[2px] border-b-[2px] bg-amber-500 border-white z-[-1]" />
        </div>
      </AdvancedMarker>

      {open && (
        <InfoWindow 
          anchor={marker} 
          onCloseClick={() => setOpen(false)}
          pixelOffset={[0, -10]}
        >
          <div className="p-1 min-w-[160px] max-w-[200px] flex flex-col gap-2">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {place.displayName || place.name}
            </h3>
            {place.formattedAddress && (
              <p className="text-xs text-slate-500 line-clamp-2">
                {place.formattedAddress}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
                {place.rating && (
                    <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span className="text-[10px] font-bold">{place.rating}</span>
                    </div>
                )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const BookmarksLayer = () => {
  const bookmarkedPlaces = useVantiStore((state) => state.bookmarkedPlaces);
  const bookmarks = Object.values(bookmarkedPlaces);

  if (bookmarks.length === 0) return null;

  return (
    <>
      {bookmarks.map((place) => (
        <BookmarkMarker key={`bookmark-${place.id || place.placeId}`} place={place} />
      ))}
    </>
  );
};
