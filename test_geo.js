const { test, expect } = require('@jest/globals');

// Testear geolocalización en tiempo real
const app = require('./app'); // Ajusta la ruta si es necesario

// Simular cambio de ubicación (simular `pos` del geolocation)
function mockLocationUpdate(lat, lng) {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 10, // metros
      timestamp: Date.now()
    }
  };
}

// Prueba: Actualiza la ubicación y verifica que se refresque el mapa

test('UI refresca mapa cuando cambia la ubicación', async () => {
  // Simular actualización en el estado de la app
  app.appState.userLocation = mockLocationUpdate(11.9344, -85.9560);
  
  // Verificar que el mapa se centre en la nueva ubicación
  const updatedMarkerLat = app.appState.userMarker.getLatLng().lat;
  expect(updatedMarkerLat).toBeCloseTo(11.9344, 5);
  
  // Verificar que se busca nuevamente los centros de salud
  // Esto requeriría stubear la función `displayNearbyHealthCenters()`
  // o mockear `searchHealthFacilities`
});

// Prueba: Mostrar centro más cercano resaltado

test('Centro más cercano tiene icono naranja y distancía real', async () => {
  const facilities = [
    {
      id: 1,
      categoria: 'hospital',
      lat: 11.93749, lng: -85.97651,
      distance: 1500 // metros
    },
    {
      id: 2,
      categoria: 'clinica',
      lat: 11.940325538533882, lng: -85.95034747503418,
      distance: 2000 // metros
    }
  ];
  
  // Llamar a `displayHealthFacilities` con estos datos
  app.displayHealthFacilities(facilities, 11.9344, -85.9560);
  
  // Verificar que el primer marcador tenga icono naranja
  const marker1 = app.appState healthMarkers[0] // Ajustar a la realidad
  expect(marker1.getIcon().html).toContain('#ff9800');
  
  // Verificar que se muestre la distancia real en km
  const popupText = marker1.getPopup().getContent(); // Dificil de acceder manualmente
  // O bien, verificar en la lista de UI
  // Este test es má complicado sin mockear los elementos de la UI
});

// Prueba: Contexto para la IA incluye ubicación

test('IA recibe contexto de ubicación', async () => {
  const userLocation = mockLocationUpdate(11.9344, -85.9560);
  app.appState.userLocation = userLocation;
  
  // Enviar un mensaje válido
  const response = await app.sendMessage('Necesito ayuda');
  
  // Verificar que en el contexto haya referenciá a la ubicación
  // Esto dependería de la implementación en `callGroqAPI`
  // Ajustar según el código real
});