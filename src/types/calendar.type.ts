/**
 * TIPOS DE TYPESCRIPT PARA CALENDARIOS
 * 
 * Define las interfaces para trabajar con calendarios específicos del usuario.
 * Basado en la API del backend que maneja calendarios de Google Calendar.
 * 
 * 📅 CONCEPTOS:
 * - Calendar: Un calendario específico de Google Calendar del usuario
 * - Primary: El calendario principal/por defecto del usuario
 * - AccessRole: Permisos del usuario en el calendario (owner, writer, reader)
 * - Active: Calendarios que están habilitados y sincronizados
 */

/**
 * 📅 CALENDARIO INDIVIDUAL
 * 
 * Representa un calendario específico del usuario en Google Calendar
 */
export interface CalendarType {
  /** ID único del calendario (ej: "primary", "work@company.com") */
  id: string;
  
  /** Nombre descriptivo del calendario */
  name: string;
  
  /** Descripción opcional del calendario */
  description?: string;
  
  /** Indica si es el calendario principal del usuario */
  isPrimary: boolean;
  
  /** Rol de acceso del usuario en este calendario */
  accessRole: CalendarAccessRole;
  
  /** Si el calendario está activo/habilitado */
  isActive: boolean;
  
  /** Si el usuario puede escribir/crear eventos en este calendario */
  isWritable: boolean;
  
  /** Color de fondo del calendario (para UI) */
  backgroundColor?: string;
  
  /** Color de primer plano del calendario (para UI) */
  foregroundColor?: string;
  
  /** Zona horaria del calendario */
  timeZone?: string;
  
  /** Resumen/título del calendario */
  summary?: string;
}

/**
 * 🔐 ROLES DE ACCESO AL CALENDARIO
 * 
 * Define qué permisos tiene el usuario en cada calendario
 */
export enum CalendarAccessRole {
  /** Propietario del calendario - permisos completos */
  OWNER = "owner",
  
  /** Editor - puede crear/editar/eliminar eventos */
  WRITER = "writer", 
  
  /** Solo lectura - puede ver eventos pero no modificar */
  READER = "reader",
  
  /** Acceso libre/ocupado - solo ve disponibilidad, no detalles */
  FREE_BUSY_READER = "freeBusyReader"
}

/**
 * 📋 RESPUESTA DE LISTA DE CALENDARIOS
 * 
 * Estructura de respuesta cuando se obtienen calendarios del usuario
 */
export interface CalendarListResponse {
  /** Indica si la operación fue exitosa */
  success: boolean;
  
  /** Mensaje descriptivo de la operación */
  message: string;
  
  /** Array de calendarios del usuario */
  data: CalendarType[];
  
  /** Metadatos adicionales */
  meta?: {
    /** Total de calendarios disponibles */
    total: number;
    
    /** Calendarios activos */
    active: number;
    
    /** Calendarios con permisos de escritura */
    writable: number;
    
    /** Última sincronización */
    lastSync?: string;
  };
}

/**
 * 🔄 RESPUESTA DE SINCRONIZACIÓN
 * 
 * Respuesta cuando se sincronizan calendarios desde Google
 */
export interface CalendarSyncResponse {
  /** Indica si la sincronización fue exitosa */
  success: boolean;
  
  /** Mensaje descriptivo de la operación */
  message: string;
  
  /** Estadísticas de la sincronización */
  data: {
    /** Calendarios sincronizados correctamente */
    synced: number;
    
    /** Total de calendarios encontrados */
    total: number;
    
    /** Calendarios con errores */
    errors: number;
    
    /** Si fue una sincronización forzada (forceRefresh) */
    forced: boolean;
    
    /** Timestamp de la sincronización */
    timestamp: string;
  };
  
  /** Errores específicos si los hubo */
  errors?: Array<{
    calendarId: string;
    error: string;
  }>;
}

/**
 * 🔍 RESPUESTA DE CALENDARIO ESPECÍFICO
 * 
 * Cuando se obtienen detalles de un calendario individual
 */
export interface CalendarDetailResponse {
  /** Indica si la operación fue exitosa */
  success: boolean;
  
  /** Mensaje descriptivo */
  message: string;
  
  /** Datos detallados del calendario */
  data: CalendarType;
}

/**
 * ⚙️ OPCIONES DE CONSULTA DE CALENDARIOS
 * 
 * Parámetros opcionales para filtrar calendarios
 */
export interface CalendarQueryOptions {
  /** Solo calendarios activos */
  onlyActive?: boolean;
  
  /** Solo calendarios con permisos de escritura */
  onlyWritable?: boolean;
  
  /** Solo calendarios primarios */
  onlyPrimary?: boolean;
  
  /** Incluir calendarios inactivos */
  includeInactive?: boolean;
}

/**
 * 🔄 PAYLOAD PARA SINCRONIZACIÓN
 * 
 * Datos que se envían para sincronizar calendarios
 */
export interface CalendarSyncPayload {
  /** Si se debe forzar una sincronización completa */
  forceRefresh?: boolean;
  
  /** Calendarios específicos a sincronizar (opcional) */
  calendarIds?: string[];
}

/**
 * 🎯 CALENDARIO SELECCIONADO EN FORMULARIOS
 * 
 * Estructura simplificada para formularios que seleccionan calendario
 */
export interface SelectedCalendar {
  /** ID del calendario */
  id: string;
  
  /** Nombre del calendario */
  name: string;
  
  /** Si es el calendario principal */
  isPrimary?: boolean;
}

/**
 * 📊 ESTADÍSTICAS DE CALENDARIOS
 * 
 * Métricas y estadísticas sobre calendarios del usuario
 */
export interface CalendarStats {
  /** Total de calendarios */
  total: number;
  
  /** Calendarios activos */
  active: number;
  
  /** Calendarios con permisos de escritura */
  writable: number;
  
  /** Calendarios compartidos */
  shared: number;
  
  /** Calendarios propios */
  owned: number;
}

/**
 * 🚨 TIPOS DE ERROR ESPECÍFICOS DE CALENDARIOS
 * 
 * Errores comunes al trabajar con calendarios
 */
export enum CalendarErrorType {
  /** No se encontró el calendario */
  CALENDAR_NOT_FOUND = "CALENDAR_NOT_FOUND",
  
  /** Sin permisos para acceder al calendario */
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  
  /** Token de Google expirado */
  GOOGLE_TOKEN_EXPIRED = "GOOGLE_TOKEN_EXPIRED",
  
  /** Error de sincronización */
  SYNC_ERROR = "SYNC_ERROR",
  
  /** Límite de calendarios excedido */
  CALENDAR_LIMIT_EXCEEDED = "CALENDAR_LIMIT_EXCEEDED"
}

/**
 * 🔧 UTILITIES Y HELPERS
 */

/**
 * Obtiene el calendario por defecto de una lista
 */
export const getDefaultCalendar = (calendars: CalendarType[]): CalendarType | null => {
  // Primero buscar el primary
  const primary = calendars.find(cal => cal.isPrimary);
  if (primary) return primary;
  
  // Si no hay primary, buscar el primero writable
  const writable = calendars.find(cal => cal.isWritable);
  if (writable) return writable;
  
  // Como último recurso, el primero disponible
  return calendars[0] || null;
};

/**
 * Filtra calendarios según criterios específicos
 */
export const filterCalendars = (
  calendars: CalendarType[], 
  options: CalendarQueryOptions
): CalendarType[] => {
  let filtered = [...calendars];
  
  if (options.onlyActive) {
    filtered = filtered.filter(cal => cal.isActive);
  }
  
  if (options.onlyWritable) {
    filtered = filtered.filter(cal => cal.isWritable);
  }
  
  if (options.onlyPrimary) {
    filtered = filtered.filter(cal => cal.isPrimary);
  }
  
  if (!options.includeInactive) {
    filtered = filtered.filter(cal => cal.isActive);
  }
  
  return filtered;
};

/**
 * Convierte CalendarType a SelectedCalendar para formularios
 */
export const toSelectedCalendar = (calendar: CalendarType): SelectedCalendar => ({
  id: calendar.id,
  name: calendar.name,
  isPrimary: calendar.isPrimary
});

/**
 * Genera color de badge según el tipo de calendario
 */
export const getCalendarBadgeColor = (calendar: CalendarType): string => {
  if (calendar.isPrimary) return "bg-blue-100 text-blue-800";
  if (calendar.accessRole === CalendarAccessRole.OWNER) return "bg-green-100 text-green-800";
  if (calendar.accessRole === CalendarAccessRole.WRITER) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
};

/**
 * Obtiene el ícono según el rol de acceso
 */
export const getCalendarIcon = (calendar: CalendarType): string => {
  if (calendar.isPrimary) return "👤"; // Usuario principal
  if (calendar.accessRole === CalendarAccessRole.OWNER) return "👑"; // Propietario
  if (calendar.accessRole === CalendarAccessRole.WRITER) return "✏️"; // Editor
  return "👁️"; // Solo lectura
};

/**
 * Valida si un calendario puede ser usado para crear eventos
 */
export const canCreateEventsInCalendar = (calendar: CalendarType): boolean => {
  return calendar.isActive && calendar.isWritable && 
         [CalendarAccessRole.OWNER, CalendarAccessRole.WRITER].includes(calendar.accessRole);
};