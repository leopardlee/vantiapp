import React, { useState, useEffect } from 'react';
import { useMap, AdvancedMarker } from '@vis.gl/react-google-maps';

export class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Map Marker Render Error Shielded:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export const SafeAdvancedMarker = React.memo(function SafeAdvancedMarker(props: any) {
  const map = useMap();
  const [isProjectionReady, setIsProjectionReady] = useState(false);

  useEffect(() => {
    if (!map) return;
    
    const checkProjection = () => {
      try {
        const projection = map.getProjection();
        if (projection) {
          setIsProjectionReady(true);
          return;
        }
      } catch (err) {
        // Silent fail, will retry
      }
      setTimeout(checkProjection, 50);
    };
    
    checkProjection();
  }, [map]);

  if (!isProjectionReady || !map) return null;

  return (
    <MapErrorBoundary>
      <AdvancedMarker {...props}>
        {props.children}
      </AdvancedMarker>
    </MapErrorBoundary>
  );
});
