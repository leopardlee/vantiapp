import React from 'react';
import { Polyline } from '@vis.gl/react-google-maps';

export function BreadcrumbLayer({ path }: { path: { lat: number; lng: number }[] }) {
    if (path.length < 2) return null;
    return (
        <Polyline
            path={path}
            strokeColor="#22d3ee"
            strokeOpacity={0.8}
            strokeWeight={4}
            geodesic={true}
        />
    );
}
