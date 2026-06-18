export const ESTADOS_FACTURA = [
  { value: '', label: 'Todos los estados' },
  { value: 'FACTURADO', label: 'Facturado' },
  { value: 'NO FACTURADO', label: 'No Facturado' },
];

export const TIPOS_GASTO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Carro', label: 'Carro' },
  { value: 'General', label: 'General' },
  { value: 'Salud', label: 'Salud' },
];

export const REGISTROS_POR_PAGINA = 4;

export const BADGE_GASTO_MAP = {
  Carro: 'badge-carro',
  General: 'badge-general',
  Salud: 'badge-salud',
};

export const NAV_ITEMS = [
  { id: 'facturas', label: 'Facturas', icon: 'facturas', active: true },
  { id: 'validaciones', label: 'Validaciones', icon: 'validaciones' },
  { id: 'reporte-usuario', label: 'Reporte por Usuario', icon: 'reporte' },
  { id: 'reportes-global', label: 'Reportes Global', icon: 'reportes' },
  { id: 'reporte-pendientes', label: 'Reporte de Pendientes', icon: 'pendientes' },
  { id: 'usuarios', label: 'Usuarios', icon: 'usuarios' },
  { id: 'perfil', label: 'Mi Perfil', icon: 'perfil' },
];
