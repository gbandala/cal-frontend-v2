/**
 * FUNCIONES DE API PARA LA APLICACIÓN DE CALENDARIO
 * 
 * Este archivo contiene todas las funciones que interactúan con el backend.
 * Se divide en secciones organizadas por funcionalidad:
 * 
 * 📁 ESTRUCTURA:
 * ├── AUTH: Autenticación (login, registro)
 * ├── EVENTS: Gestión de eventos del usuario
 * ├── INTEGRATIONS: Conectar con servicios externos (Zoom, Meet, etc.)
 * ├── AVAILABILITY: Configurar horarios disponibles
 * ├── MEETINGS: Reuniones programadas
 * └── PUBLIC: APIs accesibles sin autenticación
 * 
 * 🔧 PATRONES UTILIZADOS:
 * - API: Para endpoints que requieren autenticación
 * - PublicAPI: Para endpoints públicos (sin token)
 * - Logging completo para debugging
 * - Manejo de errores con try/catch
 * - TypeScript para type safety
 */

import {
  AvailabilityType,
  CreateEventPayloadType,
  CreateMeetingType,
  GetAllIntegrationResponseType,
  LoginResponseType,
  loginType,
  PeriodType,
  PublicAvailabilityEventResponseType,
  PublicEventResponseType,
  PublicSingleEventDetailResponseType,
  registerType,
  ToggleEventVisibilityResponseType,
  UserAvailabilityResponseType,
  UserEventListResponse,
  UserMeetingsResponseType,
} from "@/types/api.type";
import { API, PublicAPI } from "./axios-client";
import { IntegrationAppType, VideoConferencingPlatform } from "./types";
import {
  CalendarListResponse,
  CalendarSyncResponse,
  CalendarDetailResponse,
  CalendarQueryOptions,
  CalendarSyncPayload
} from "@/types/calendar.type";

//*********** AUTH APIS - AUTENTICACIÓN DE USUARIOS ***********
/*
 * Estas funciones manejan el proceso de autenticación:
 * - Login: Autentica usuario y retorna token JWT
 * - Register: Crea nueva cuenta de usuario
 * 
 * 🔒 SEGURIDAD: Los passwords se ocultan en los logs por seguridad
 * 🔑 TOKEN: El login retorna un accessToken para futuras peticiones
 */

/**
 * 🔐 FUNCIÓN DE LOGIN
 * 
 * Autentica un usuario existente en el sistema
 * 
 * @param data - Credenciales del usuario (email/username + password)
 * @returns Promise<LoginResponseType> - Datos del usuario + token de acceso
 * 
 * FLUJO:
 * 1. Recibe credenciales del usuario
 * 2. Envía petición POST a /auth/login
 * 3. Si es exitoso: retorna datos del usuario + accessToken
 * 4. Si falla: lanza error para manejo en UI
 * 
 * NOTA: Usa API (autenticada) aunque sea login porque puede requerir headers especiales
 */
export const loginMutationFn = async (
  data: loginType
): Promise<LoginResponseType> => {
  // console.log("🔐 [LOGIN] Iniciando proceso de login", {
  //   endpoint: "/auth/login",
  //   inputData: { 
  //     ...data, 
  //     password: "***HIDDEN***" // Ocultar password por seguridad
  //   }
  // });

  try {
    const response = await API.post("/auth/login", data);

    // console.log("✅ [LOGIN] Login exitoso", {
    //   status: response.status,
    //   hasToken: !!response.data.accessToken,
    //   userData: {
    //     ...response.data,
    //     accessToken: response.data.accessToken ? 
    //       response.data.accessToken.substring(0, 10) + "..." : "N/A"
    //   }
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [LOGIN] Error en login", {
      error,
      inputData: { ...data, password: "***HIDDEN***" }
    });
    throw error; // Re-lanza el error para que lo maneje el componente
  }
};

/**
 * 👤 FUNCIÓN DE REGISTRO
 * 
 * Crea una nueva cuenta de usuario en el sistema
 * 
 * @param data - Información del nuevo usuario (nombre, email, password, etc.)
 * @returns Promise - Respuesta del servidor (puede incluir auto-login)
 * 
 * FLUJO:
 * 1. Recibe datos del nuevo usuario
 * 2. Envía petición POST a /auth/register  
 * 3. El servidor crea la cuenta
 * 4. Puede retornar datos del usuario o requerir verificación por email
 * 
 * NOTA: También oculta el password en logs por seguridad
 */
export const registerMutationFn = async (
  data: registerType,
  timezone?: string  // 👈 Nuevo parámetro opcional
) => {
  // console.log("👤 [REGISTER] Iniciando registro de usuario", {
  //   endpoint: "/auth/register",
  //   inputData: {
  //     ...data,
  //     password: "***HIDDEN***"
  //   }
  // });

  try {
    let url = `/auth/register`;
    const params = new URLSearchParams();
    if (timezone) params.append('timezone', timezone);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    const response = await API.post(url, data);

    // const response = await API.post("/auth/register", data);

    // console.log("✅ [REGISTER] Registro exitoso", {
    //   status: response.status,
    //   responseData: response.data
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [REGISTER] Error en registro", {
      error,
      inputData: { ...data, password: "***HIDDEN***" }
    });
    throw error;
  }
};

//*********** EVENT APIS - GESTIÓN DE EVENTOS ***********
/*
 * Estas funciones manejan el CRUD de eventos:
 * - Create: Crear nuevos tipos de eventos (ej: "Consulta 30min", "Reunión 1h")
 * - Read: Obtener lista de eventos del usuario
 * - Update: Cambiar visibilidad (público/privado)
 * 
 * 🎯 CONCEPTO: Los "eventos" son TIPOS de reuniones que el usuario ofrece
 * Ejemplo: "Consulta 30 minutos", "Demo del producto 45 min"
 * 
 * 🔒 AUTENTICACIÓN: Todas requieren token (usan instancia API)
 */

/**
 * 📅 CREAR NUEVO EVENTO
 * 
 * Crea un nuevo tipo de evento que el usuario puede ofrecer
 * 
 * @param data - Configuración del evento (título, duración, descripción, etc.)
 * @returns Promise - Datos del evento creado
 * 
 * EJEMPLO DE USO:
 * CreateEventMutationFn({
 *   title: "Consulta médica",
 *   duration: 30,
 *   description: "Consulta general de 30 minutos",
 *   isPublic: true
 * })
 * 
 * FLUJO:
 * 1. Usuario define un nuevo tipo de reunión
 * 2. Se envía al backend para crear el evento
 * 3. El evento queda disponible para que otros lo agenden
 */
export const CreateEventMutationFn = async (data: CreateEventPayloadType) => {
  // console.log("📅 [CREATE_EVENT] Creando nuevo evento", {
  //   endpoint: "/event/create",
  //   inputData: data
  // });

  try {
    const response = await API.post("/event/create", data);

    // console.log("✅ [CREATE_EVENT] Evento creado exitosamente", {
    //   status: response.status,
    //   responseData: response.data
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [CREATE_EVENT] Error al crear evento", {
      error,
      inputData: data
    });
    throw error;
  }
};

/**
 * 👁️ CAMBIAR VISIBILIDAD DEL EVENTO
 * 
 * Alterna entre público (cualquiera puede agendar) y privado (solo con link directo)
 * 
 * @param data - ID del evento a modificar
 * @returns Promise<ToggleEventVisibilityResponseType> - Nuevo estado de visibilidad
 * 
 * CASOS DE USO:
 * - Hacer público: Evento aparece en página pública del usuario
 * - Hacer privado: Solo accesible con link directo
 * 
 * FLUJO:
 * 1. Usuario selecciona evento de su lista
 * 2. Hace clic en toggle de visibilidad
 * 3. Se actualiza en backend
 * 4. UI se actualiza con nuevo estado
 */
export const toggleEventVisibilityMutationFn = async (data: {
  eventId: string;
}): Promise<ToggleEventVisibilityResponseType> => {
  // console.log("👁️ [TOGGLE_VISIBILITY] Cambiando visibilidad del evento", {
  //   endpoint: "/event/toggle-privacy",
  //   inputData: data
  // });

  try {
    const response = await API.put("/event/toggle-privacy", data);

    // console.log("✅ [TOGGLE_VISIBILITY] Visibilidad actualizada", {
    //   status: response.status,
    //   eventId: data.eventId,
    //   responseData: response.data
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [TOGGLE_VISIBILITY] Error al cambiar visibilidad", {
      error,
      eventId: data.eventId
    });
    throw error;
  }
};

/**
 * 📋 OBTENER LISTA DE EVENTOS DEL USUARIO
 * 
 * Recupera todos los tipos de eventos que el usuario ha creado
 * 
 * @returns Promise<UserEventListResponse> - Array de eventos con su configuración
 * 
 * RESPUESTA TÍPICA:
 * {
 *   events: [
 *     { id: "1", title: "Consulta 30min", duration: 30, isPublic: true },
 *     { id: "2", title: "Demo producto", duration: 45, isPublic: false }
 *   ]
 * }
 * 
 * USO EN UI:
 * - Dashboard del usuario para gestionar sus eventos
 * - Lista para seleccionar qué evento editar
 * - Mostrar estadísticas (cuántos eventos tiene)
 */
export const geteventListQueryFn = async (): Promise<UserEventListResponse> => {
  // console.log("📋 [GET_EVENTS] Obteniendo lista de eventos del usuario", {
  //   endpoint: "/event/all"
  // });

  try {
    const response = await API.get(`/event/all`);

    console.log("✅ [GET_EVENTS] Lista de eventos obtenida", {
      status: response.status,
      eventCount: response.data.events?.length || 0,
      responseData: response.data
    });

    return response.data;
  } catch (error) {
    console.log("❌ [GET_EVENTS] Error al obtener eventos", {
      error
    });
    throw error;
  }
};

//*********** INTEGRATION APIS - INTEGRACIONES CON SERVICIOS EXTERNOS ***********
/*
 * Estas funciones manejan la conexión con plataformas de videoconferencia:
 * - Zoom, Google Meet, Microsoft Teams, etc.
 * - Verificar estado de conexión
 * - Conectar nuevas integraciones
 * - Obtener lista de todas las integraciones
 * 
 * 🔗 PROPÓSITO: Automatizar la creación de links de reunión
 * Cuando alguien agenda una cita, automáticamente se crea el link de Zoom/Meet
 * 
 * 🔒 AUTENTICACIÓN: Requieren token del usuario
 */

/**
 * 🔗 VERIFICAR ESTADO DE INTEGRACIÓN
 * 
 * Verifica si el usuario tiene conectada una plataforma específica
 * 
 * @param appType - Tipo de aplicación (zoom, googlemeet, teams, etc.)
 * @returns Promise - Estado de conexión y configuración
 * 
 * EJEMPLO DE USO:
 * checkIntegrationQueryFn("zoom") 
 * // Retorna: { isConnected: true, accountEmail: "user@domain.com" }
 * 
 * CASOS DE USO:
 * - Mostrar iconos verdes/rojos en UI según estado
 * - Habilitar/deshabilitar opciones según integraciones
 * - Validar antes de crear reuniones automáticas
 */
export const checkIntegrationQueryFn = async (
  appType: VideoConferencingPlatform
) => {
  // console.log("🔗 [CHECK_INTEGRATION] Verificando integración", {
  //   endpoint: `integration/check/${appType}`,
  //   appType
  // });

  try {
    const response = await API.get(`integration/check/${appType}`);

    // console.log("✅ [CHECK_INTEGRATION] Estado de integración obtenido", {
    //   status: response.status,
    //   appType,
    //   isConnected: response.data.isConnected,
    //   responseData: response.data
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [CHECK_INTEGRATION] Error al verificar integración", {
      error,
      appType
    });
    throw error;
  }
};

/**
 * 🔗 OBTENER TODAS LAS INTEGRACIONES
 * 
 * Recupera el estado de todas las plataformas de videoconferencia
 * 
 * @returns Promise<GetAllIntegrationResponseType> - Lista completa con estados
 * 
 * RESPUESTA TÍPICA:
 * {
 *   integrations: [
 *     { type: "zoom", isConnected: true, accountEmail: "user@zoom.us" },
 *     { type: "googlemeet", isConnected: false },
 *     { type: "teams", isConnected: true, accountEmail: "user@microsoft.com" }
 *   ]
 * }
 * 
 * USO EN UI:
 * - Dashboard de integraciones
 * - Página de configuración
 * - Seleccionar plataforma por defecto para reuniones
 */
export const getAllIntegrationQueryFn =
  async (): Promise<GetAllIntegrationResponseType> => {
    // console.log("🔗 [GET_ALL_INTEGRATIONS] Obteniendo todas las integraciones", {
    //   endpoint: "integration/all"
    // });

    try {
      const response = await API.get(`integration/all`);

      // console.log("✅ [GET_ALL_INTEGRATIONS] Integraciones obtenidas", {
      //   status: response.status,
      //   integrationCount: response.data.integrations?.length || 0,
      //   responseData: response.data
      // });

      return response.data;
    } catch (error) {
      console.log("❌ [GET_ALL_INTEGRATIONS] Error al obtener integraciones", {
        error
      });
      throw error;
    }
  };

/**
 * 🔌 CONECTAR NUEVA INTEGRACIÓN
 * 
 * Inicia el proceso de OAuth para conectar una plataforma
 * 
 * @param appType - Tipo de aplicación a conectar
 * @returns Promise - URL de redirección para OAuth o token de acceso
 * 
 * FLUJO TÍPICO DE OAUTH:
 * 1. Usuario hace clic en "Conectar Zoom"
 * 2. Esta función retorna URL de autorización de Zoom
 * 3. Usuario es redirigido a Zoom para autorizar
 * 4. Zoom redirige de vuelta con código de autorización
 * 5. Backend intercambia código por token de acceso
 * 6. Integración queda conectada
 * 
 * NOTA: La respuesta puede variar según la plataforma
 */
export const connectAppIntegrationQueryFn = async (
  appType: IntegrationAppType
) => {
  // console.log("🔌 [CONNECT_INTEGRATION] Conectando integración", {
  //   endpoint: `integration/connect/${appType}`,
  //   appType
  // });

  try {
    const response = await API.get(`integration/connect/${appType}`);

    // console.log("✅ [CONNECT_INTEGRATION] Integración conectada", {
    //   status: response.status,
    //   appType,
    //   responseData: response.data
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [CONNECT_INTEGRATION] Error al conectar integración", {
      error,
      appType
    });
    throw error;
  }
};

//*********** */ AVAILABILITY APIS

export const getUserAvailabilityQueryFn =
  async (
    timezone?: string,
  ): Promise<UserAvailabilityResponseType> => {
    // console.log("⏰ [GET_AVAILABILITY] Obteniendo disponibilidad del usuario", {
    //   endpoint: "/availability/me"
    // });

    try {
      let url = `/availability/me`;
      const params = new URLSearchParams();
      if (timezone) params.append('timezone', timezone);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      const response = await API.get(url);

      console.log("✅ [GET_AVAILABILITY] Disponibilidad obtenida", {
        status: response.status,
        hasSchedule: !!response.data.schedule,
        responseData: response.data.availability
      });

      return response.data;
    } catch (error) {
      console.log("❌ [GET_AVAILABILITY] Error al obtener disponibilidad", {
        error
      });
      throw error;
    }
  };

export const updateUserAvailabilityMutationFn = async (
  data: AvailabilityType
) => {
  // console.log("⏰ [UPDATE_AVAILABILITY] Actualizando disponibilidad", {
  //   endpoint: "/availability/update",
  //   inputData: data
  // });

  try {
    const response = await API.put("/availability/update", data);

    console.log("✅ [UPDATE_AVAILABILITY] Disponibilidad actualizada", {
      status: response.status,
      responseData: response.data
    });

    return response.data;
  } catch (error) {
    console.log("❌ [UPDATE_AVAILABILITY] Error al actualizar disponibilidad", {
      error,
      inputData: data
    });
    throw error;
  }
};

//*********** */ MEETING APIS

export const getUserMeetingsQueryFn = async (
  filter: PeriodType
): Promise<UserMeetingsResponseType> => {
  // console.log("📅 [GET_MEETINGS] Obteniendo reuniones del usuario", {
  //   endpoint: `/meeting/user/all${filter ? `?filter=${filter}` : ""}`,
  //   filter
  // });

  try {
    const response = await API.get(
      `/meeting/user/all${filter ? `?filter=${filter}` : ""}`
    );

    console.log("✅ [GET_MEETINGS] Reuniones obtenidas", {
      status: response.status,
      filter,
      meetingCount: response.data.meetings?.length || 0,
      responseData: response.data
    });

    return response.data;
  } catch (error) {
    console.log("❌ [GET_MEETINGS] Error al obtener reuniones", {
      error,
      filter
    });
    throw error;
  }
};

export const cancelMeetingMutationFn = async (meetingId: string) => {
  console.log("❌ [CANCEL_MEETING] Cancelando reunión", {
    endpoint: `/meeting/cancel/${meetingId}`,
    meetingId
  });

  try {
    const response = await API.put(`/meeting/cancel/${meetingId}`, {});

    // console.log("✅ [CANCEL_MEETING] Reunión cancelada exitosamente", {
    //   status: response.status,
    //   meetingId,
    //   responseData: response.data
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [CANCEL_MEETING] Error al cancelar reunión", {
      error,
      meetingId
    });
    throw error;
  }
};

//*********** */ All EXTERNAL/PUBLIC APIS

export const getAllPublicEventQueryFn = async (
  username: string
): Promise<PublicEventResponseType> => {
  // console.log("🌍 [GET_PUBLIC_EVENTS] Obteniendo eventos públicos", {
  //   endpoint: `/event/public/${username}`,
  //   username
  // });

  try {
    const response = await PublicAPI.get(`/event/public/${username}`);

    console.log("✅ [GET_PUBLIC_EVENTS] Eventos públicos obtenidos", {
      status: response.status,
      username,
      eventCount: response.data.events?.length || 0,
      responseData: response.data
    });

    return response.data;
  } catch (error) {
    console.log("❌ [GET_PUBLIC_EVENTS] Error al obtener eventos públicos", {
      error,
      username
    });
    throw error;
  }
};

export const getSinglePublicEventBySlugQueryFn = async (data: {
  username: string;
  slug: string;
}): Promise<PublicSingleEventDetailResponseType> => {
  // console.log("🌍 [GET_PUBLIC_EVENT_DETAIL] Obteniendo detalle de evento público", {
  //   endpoint: `/event/public/${data.username}/${data.slug}`,
  //   inputData: data
  // });

  try {
    const response = await PublicAPI.get(
      `/event/public/${data.username}/${data.slug}`
    );

    console.log("✅ [GET_PUBLIC_EVENT_DETAIL] Detalle de evento obtenido", {
      status: response.status,
      username: data.username,
      slug: data.slug,
      eventTitle: response.data.event?.title || "N/A",
      responseData: response.data
    });

    return response.data;
  } catch (error) {
    console.log("❌ [GET_PUBLIC_EVENT_DETAIL] Error al obtener detalle", {
      error,
      inputData: data
    });
    throw error;
  }
};

export const getPublicAvailabilityByEventIdQueryFn = async (
  eventId: string,
  timezone?: string,
  date?: string,
): Promise<PublicAvailabilityEventResponseType> => {
  // console.log("🌍 [GET_PUBLIC_AVAILABILITY] Obteniendo disponibilidad pública", {
  //   endpoint: `/availability/public/${eventId}${timezone ? `?timezone=${timezone}` : ""}${date ? `&date=${date}` : ""}`,
  //   eventId,
  //   timezone,
  //   date
  // });
  let url = `/availability/public/${eventId}`;
  const params = new URLSearchParams();

  if (timezone) params.append('timezone', timezone);
  if (date) params.append('date', date);

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  console.log("🌍 [GET_PUBLIC_AVAILABILITY] Obteniendo disponibilidad pública", {
    endpoint: url,
    eventId,
    timezone,
    date
  });
  try {
    const response = await PublicAPI.get(url);

    console.log("✅ [GET_PUBLIC_AVAILABILITY] Disponibilidad obtenida", {
      status: response.status,
      eventId,
      timezone,
      date,
      availableDays: response.data.data?.length || 0,
      responseData: response.data
    });

    return response.data;
  } catch (error) {
    console.log("❌ [GET_PUBLIC_AVAILABILITY] Error al obtener disponibilidad", {
      error,
      eventId,
      timezone,
      date
    });
    throw error;
  }
};

export const scheduleMeetingMutationFn = async (data: CreateMeetingType) => {
  // console.log("📅 [SCHEDULE_MEETING] Programando nueva reunión", {
  //   endpoint: "/meeting/public/create",
  //   inputData: {
  //     ...data,
  //     // Ocultar información sensible si existe
  //     eventId: data.eventId
  //   }
  // });

  try {
    const response = await API.post("/meeting/public/create", data);

    console.log("✅ [SCHEDULE_MEETING] Reunión programada exitosamente", {
      status: response.status,
      meetingId: response.data.meeting?.id || "N/A",
      eventId: data.eventId,
      responseData: response.data
    });

    return response.data;
  } catch (error) {
    console.log("❌ [SCHEDULE_MEETING] Error al programar reunión", {
      error,
      eventId: data.eventId
    });
    throw error;
  }
};


//*********** CALENDAR APIS - GESTIÓN DE CALENDARIOS ESPECÍFICOS ***********
/*
 * ✅ NUEVAS FUNCIONES - Soporte para calendarios específicos del usuario
 * 
 * Estas funciones manejan la gestión de calendarios de Google Calendar:
 * - Obtener lista de calendarios disponibles del usuario
 * - Sincronizar calendarios desde Google Calendar
 * - Obtener detalles de calendarios específicos
 * 
 * 🎯 PROPÓSITO: Permitir que usuarios creen eventos en calendarios específicos
 * En lugar de usar siempre "primary", pueden elegir calendarios dedicados como:
 * - "trabajo@empresa.com" para eventos laborales
 * - "consultorio@medico.com" para citas médicas
 * - "personal@gmail.com" para eventos personales
 * 
 * 🔒 AUTENTICACIÓN: Todas requieren token del usuario (usan instancia API)
 * 📋 CACHE: El backend mantiene cache de calendarios para mejor performance
 */

/**
 * 📅 OBTENER LISTA DE CALENDARIOS DEL USUARIO
 * 
 * Recupera todos los calendarios disponibles del usuario autenticado.
 * Si no hay cache o está desactualizado, sincroniza automáticamente desde Google.
 * 
 * @param options - Filtros opcionales para la consulta
 * @returns Promise<CalendarListResponse> - Lista de calendarios con metadatos
 * 
 * RESPUESTA TÍPICA:
 * {
 *   success: true,
 *   message: "Calendars retrieved successfully",
 *   data: [
 *     { id: "primary", name: "Juan Pérez", isPrimary: true, isWritable: true },
 *     { id: "work@company.com", name: "Trabajo", isPrimary: false, isWritable: true },
 *     { id: "team@company.com", name: "Equipo", isPrimary: false, isWritable: false }
 *   ],
 *   meta: { total: 3, active: 3, writable: 2 }
 * }
 * 
 * CASOS DE USO:
 * - Dropdown en formulario de creación de eventos
 * - Dashboard de gestión de calendarios
 * - Verificar qué calendarios están disponibles
 * 
 * FILTROS DISPONIBLES:
 * - onlyActive: Solo calendarios activos
 * - onlyWritable: Solo calendarios donde puede crear eventos
 * - onlyPrimary: Solo el calendario principal
 */
export const getCalendarsQueryFn = async (
  options?: CalendarQueryOptions
): Promise<CalendarListResponse> => {
  // Construir query parameters
  const params = new URLSearchParams();
  if (options?.onlyActive) params.append('onlyActive', 'true');
  if (options?.onlyWritable) params.append('onlyWritable', 'true');
  if (options?.onlyPrimary) params.append('onlyPrimary', 'true');
  if (options?.includeInactive) params.append('includeInactive', 'true');

  // const queryString = params.toString();
  const endpoint = `/calendars`;

  // console.log("📅 [GET_CALENDARS] Obteniendo lista de calendarios", {
  //   endpoint,
  //   options,
  //   // queryString
  // });

  try {
    const response = await API.get(endpoint);

    // console.log("✅ [GET_CALENDARS] Lista de calendarios obtenida", {
    //   status: response.status,
    //   calendarCount: response.data.data?.length || 0,
    //   writableCalendars: response.data.data?.filter((cal: { isWritable: boolean }) => cal.isWritable)?.length || 0,
    //   primaryCalendar: response.data.data?.find((cal: { isPrimary: boolean; name: string }) => cal.isPrimary)?.name || "N/A",
    //   responseData: response.data
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [GET_CALENDARS] Error al obtener calendarios", {
      error,
      options,
      endpoint
    });
    throw error;
  }
};

/**
 * 🔄 SINCRONIZAR CALENDARIOS DESDE GOOGLE
 * 
 * Fuerza una sincronización completa o incremental de calendarios desde Google Calendar API.
 * Útil cuando el usuario conecta nuevos calendarios o cambia permisos.
 * 
 * @param payload - Configuración de la sincronización
 * @returns Promise<CalendarSyncResponse> - Estadísticas de la sincronización
 * 
 * TIPOS DE SINCRONIZACIÓN:
 * - forceRefresh: true  -> Limpia cache y sincroniza todo desde cero
 * - forceRefresh: false -> Sincronización incremental (solo cambios)
 * 
 * RESPUESTA TÍPICA:
 * {
 *   success: true,
 *   message: "Calendars synchronized successfully",
 *   data: {
 *     synced: 5,
 *     total: 6,
 *     errors: 1,
 *     forced: true,
 *     timestamp: "2025-06-01T10:30:00Z"
 *   },
 *   errors: [
 *     { calendarId: "old@calendar.com", error: "Calendar not found" }
 *   ]
 * }
 * 
 * CASOS DE USO:
 * - Usuario reporta calendarios faltantes
 * - Después de conectar/desconectar Google Calendar
 * - Mantenimiento periódico de cache
 * - Cuando permisos de calendario cambian
 */
export const syncCalendarsQueryFn = async (
  payload: CalendarSyncPayload = { forceRefresh: false }
): Promise<CalendarSyncResponse> => {
  // console.log("🔄 [SYNC_CALENDARS] Sincronizando calendarios desde Google", {
  //   endpoint: "/calendars/sync",
  //   payload,
  //   syncType: payload.forceRefresh ? "FULL_REFRESH" : "INCREMENTAL"
  // });

  try {
    const response = await API.post("/calendars/sync", payload);

    console.log("✅ [SYNC_CALENDARS] Sincronización completada", {
      status: response.status,
      syncedCount: response.data.data?.synced || 0,
      totalFound: response.data.data?.total || 0,
      errorCount: response.data.data?.errors || 0,
      syncType: payload.forceRefresh ? "FORCED" : "INCREMENTAL",
      timestamp: response.data.data?.timestamp,
      responseData: response.data
    });

    return response.data;
  } catch (error) {
    console.log("❌ [SYNC_CALENDARS] Error en sincronización", {
      error,
      payload,
      syncType: payload.forceRefresh ? "FORCED" : "INCREMENTAL"
    });
    throw error;
  }
};

/**
 * 🔍 OBTENER DETALLES DE CALENDARIO ESPECÍFICO
 * 
 * Recupera información detallada de un calendario particular por su ID.
 * 
 * @param calendarId - ID del calendario (ej: "primary", "work@company.com")
 * @returns Promise<CalendarDetailResponse> - Detalles completos del calendario
 * 
 * INFORMACIÓN INCLUIDA:
 * - Configuración completa del calendario
 * - Permisos de acceso del usuario
 * - Zona horaria y configuraciones regionales
 * - Colores y personalización
 * 
 * CASOS DE USO:
 * - Mostrar configuración detallada de calendario
 * - Validar permisos antes de crear eventos
 * - Obtener zona horaria para conversiones
 * 
 * CALENDARIOS ESPECIALES:
 * - "primary": Calendario principal del usuario
 * - Email addresses: Calendarios compartidos o de trabajo
 */
export const getCalendarDetailsQueryFn = async (
  calendarId: string
): Promise<CalendarDetailResponse> => {
  // console.log("🔍 [GET_CALENDAR_DETAILS] Obteniendo detalles de calendario", {
  //   endpoint: `/calendars/${calendarId}`,
  //   calendarId,
  //   isSpecialCalendar: calendarId === "primary"
  // });

  try {
    const response = await API.get(`/calendars/${calendarId}`);

    // console.log("✅ [GET_CALENDAR_DETAILS] Detalles obtenidos", {
    //   status: response.status,
    //   calendarId,
    //   calendarName: response.data.data?.name || "N/A",
    //   isPrimary: response.data.data?.isPrimary || false,
    //   isWritable: response.data.data?.isWritable || false,
    //   accessRole: response.data.data?.accessRole || "N/A",
    //   responseData: response.data
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [GET_CALENDAR_DETAILS] Error al obtener detalles", {
      error,
      calendarId
    });
    throw error;
  }
};

/**
 * 📊 OBTENER ESTADÍSTICAS DE CALENDARIOS
 * 
 * Recupera métricas y estadísticas sobre los calendarios del usuario.
 * Útil para dashboards y analytics.
 * 
 * @returns Promise - Estadísticas de uso de calendarios
 * 
 * MÉTRICAS INCLUIDAS:
 * - Total de calendarios
 * - Calendarios activos vs inactivos  
 * - Calendarios con permisos de escritura
 * - Calendarios compartidos vs propios
 * - Uso de cada calendario (eventos creados)
 */
export const getCalendarStatsQueryFn = async () => {
  // console.log("📊 [GET_CALENDAR_STATS] Obteniendo estadísticas de calendarios", {
  //   endpoint: "/calendars/stats"
  // });

  try {
    const response = await API.get("/calendars/stats");

    // console.log("✅ [GET_CALENDAR_STATS] Estadísticas obtenidas", {
    //   status: response.status,
    //   totalCalendars: response.data.data?.total || 0,
    //   activeCalendars: response.data.data?.active || 0,
    //   writableCalendars: response.data.data?.writable || 0,
    //   responseData: response.data
    // });

    return response.data;
  } catch (error) {
    console.log("❌ [GET_CALENDAR_STATS] Error al obtener estadísticas", {
      error
    });
    throw error;
  }
};

