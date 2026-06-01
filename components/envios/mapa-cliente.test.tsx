// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MapaCliente from './mapa-cliente';

// Simulamos el mapa para que no explote la compu al no tener navegador
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div />,
  Marker: ({ children }: any) => <div>{children}</div>,
  Popup: ({ children }: any) => <div>{children}</div>,
  Polyline: () => <div />,
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn()
  })
}));

describe('Componente MapaCliente (MapBase)', () => {
  it('se debe montar en el DOM sin arrojar errores ni romper la aplicación', () => {
    // Intentamos cargar el componente
    const { container } = render(<MapaCliente />);
    
    // Verificamos que cargue bien
    expect(container).toBeTruthy();
  });
});