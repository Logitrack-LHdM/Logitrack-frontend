import { AlertaListadoDTO } from '@/types';

export const mockAlertas: AlertaListadoDTO[] = [
  {
    id: 4,
    idEnvio: 'ENV-2026-142',
    chofer: {
      id: 104,
      nombreCompleto: 'Miguel Ángel Ruiz',
      telefono: '+54 11 5555-4321',
    },
    tipoIncidencia: 'MECANICA',
    descripcion: 'Pinchadura de neumático trasero en Ruta 9, km 150. Esperando auxilio.',
    estado: 'PENDIENTE',
    // Simulamos una alerta muy reciente
    fechaReporte: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // Hace 15 minutos
  },
  {
    id: 3,
    idEnvio: 'ENV-2026-138',
    chofer: {
      id: 102,
      nombreCompleto: 'Carlos Gómez',
      telefono: '+54 11 4444-8765',
    },
    tipoIncidencia: 'CONTROLES',
    descripcion: 'Demora prolongada en control de balanza provincial. Fila de más de 20 camiones.',
    estado: 'PENDIENTE',
    fechaReporte: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // Hace 45 minutos
  },
  {
    id: 2,
    idEnvio: 'ENV-2026-135',
    chofer: {
      id: 105,
      nombreCompleto: 'Roberto Sánchez',
      telefono: '+54 11 3333-1234',
    },
    tipoIncidencia: 'CLIMA',
    descripcion: 'Camino de tierra intransitable por lluvias de la madrugada. El camión no puede avanzar hacia el silo.',
    estado: 'NO_RESUELTA',
    fechaReporte: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // Hace 3 horas
  },
  {
    id: 1,
    idEnvio: 'ENV-2026-120',
    chofer: {
      id: 101,
      nombreCompleto: 'Juan Pérez',
      telefono: '+54 11 2222-9876',
    },
    tipoIncidencia: 'TRAFICO',
    descripcion: 'Corte total por manifestación en el acceso al puerto. Desvío no disponible.',
    estado: 'RESUELTA',
    fechaReporte: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Hace 1 día
    fechaResolucion: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
];