/**
 * 📅 CALENDAR SELECTOR COMPONENT
 * 
 * Componente dropdown para seleccionar calendarios específicos del usuario.
 * Se integra con React Hook Form y maneja estados de loading/error.
 * 
 * 🎯 CARACTERÍSTICAS:
 * - Carga calendarios automáticamente
 * - Filtros configurables (solo writable, solo activos)
 * - Fallback inteligente a calendario primary
 * - Estados de loading y error
 * - Integración con React Hook Form
 * - Indicadores visuales por tipo de calendario
 * 
 * 📝 USO:
 * <CalendarSelector 
 *   value={selectedCalendarId}
 *   onChange={setSelectedCalendarId}
 *   onlyWritable={true}
 *   placeholder="Selecciona un calendario"
 * />
 */

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/loader";
import { 
  getCalendarsQueryFn, 
  syncCalendarsQueryFn 
} from "@/lib/api";
import { 
  CalendarType, 
  CalendarQueryOptions,
  getDefaultCalendar,
  filterCalendars,
  getCalendarBadgeColor,
  getCalendarIcon,
  canCreateEventsInCalendar
} from "@/types/calendar.type";

interface CalendarSelectorProps {
  /** Valor seleccionado actualmente (calendar_id) */
  value?: string;
  
  /** Callback cuando cambia la selección */
  onChange: (calendarId: string, calendarName: string) => void;
  
  /** Placeholder para el dropdown */
  placeholder?: string;
  
  /** Solo mostrar calendarios con permisos de escritura */
  onlyWritable?: boolean;
  
  /** Solo mostrar calendarios activos */
  onlyActive?: boolean;
  
  /** Permitir selección vacía */
  allowEmpty?: boolean;
  
  /** Texto para opción vacía */
  emptyLabel?: string;
  
  /** Si está deshabilitado */
  disabled?: boolean;
  
  /** Clase CSS adicional */
  className?: string;
  
  /** Mostrar botón de sincronización manual */
  showSyncButton?: boolean;
  
  /** Callback para errores */
  onError?: (error: unknown) => void;
}

const CalendarSelector = ({
  value,
  onChange,
  placeholder = "Seleccionar calendario",
  onlyWritable = true,
  onlyActive = true,
  allowEmpty = false,
  emptyLabel = "Sin calendario específico",
  disabled = false,
  className,
  showSyncButton = false,
  onError
}: CalendarSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarType | null>(null);

  // Opciones de consulta según props
  const queryOptions: CalendarQueryOptions = {
    onlyWritable,
    onlyActive
  };

  // Query para obtener calendarios
  const { 
    data: calendarsResponse, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery({
    queryKey: ["calendars", queryOptions],
    queryFn: () => getCalendarsQueryFn(queryOptions),
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    retry: 2
  });

  // Procesar calendarios según filtros
  const calendars = calendarsResponse?.data ? 
    filterCalendars(calendarsResponse.data, queryOptions) : [];

  // Auto-seleccionar calendario por defecto
  useEffect(() => {
    if (!value && calendars.length > 0 && !allowEmpty) {
      const defaultCalendar = getDefaultCalendar(calendars);
      if (defaultCalendar) {
        onChange(defaultCalendar.id, defaultCalendar.name);
        setSelectedCalendar(defaultCalendar);
      }
    } else if (value && calendars.length > 0) {
      const selected = calendars.find(cal => cal.id === value);
      setSelectedCalendar(selected || null);
    }
  }, [value, calendars, allowEmpty, onChange]);

  // Manejar errores
  useEffect(() => {
    if (isError && onError) {
      onError(error);
    }
  }, [isError, error, onError]);

  // Seleccionar calendario
  const handleSelectCalendar = (calendar: CalendarType | null) => {
    if (disabled) return;
    
    setSelectedCalendar(calendar);
    setIsOpen(false);
    
    if (calendar) {
      onChange(calendar.id, calendar.name);
    } else if (allowEmpty) {
      onChange("", "");
    }
  };

  // Sincronización manual
  const handleSync = async () => {
    try {
      await syncCalendarsQueryFn({ forceRefresh: true });
      refetch();
    } catch (error) {
      console.error("Error syncing calendars:", error);
    }
  };

  // Renderizar opción de calendario
  const renderCalendarOption = (calendar: CalendarType) => {
    const canCreate = canCreateEventsInCalendar(calendar);
    const badgeColor = getCalendarBadgeColor(calendar);
    const icon = getCalendarIcon(calendar);

    return (
      <div
        key={calendar.id}
        onClick={() => handleSelectCalendar(calendar)}
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors",
          !canCreate && "opacity-50 cursor-not-allowed",
          selectedCalendar?.id === calendar.id && "bg-blue-50 border-l-4 border-blue-500"
        )}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="font-medium text-sm">{calendar.name}</p>
            <p className="text-xs text-gray-500">
              {calendar.isPrimary ? "Principal" : calendar.accessRole}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {calendar.isPrimary && (
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", badgeColor)}>
              Principal
            </span>
          )}
          {!canCreate && (
            <span className="text-xs text-red-500">Sin permisos</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("relative", className)}>
      {/* Botón principal del dropdown */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm",
          "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          isOpen && "ring-1 ring-blue-500 border-blue-500"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Loader size="sm" />
            ) : (
              <Calendar className="w-4 h-4 text-gray-400" />
            )}
            
            <span className={cn(
              "text-sm",
              selectedCalendar ? "text-gray-900" : "text-gray-500"
            )}>
              {selectedCalendar ? (
                <div className="flex items-center space-x-2">
                  <span>{getCalendarIcon(selectedCalendar)}</span>
                  <span>{selectedCalendar.name}</span>
                </div>
              ) : (
                placeholder
              )}
            </span>
          </div>
          
          <ChevronDown className={cn(
            "w-4 h-4 text-gray-400 transition-transform",
            isOpen && "transform rotate-180"
          )} />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Header con sync button */}
          {showSyncButton && (
            <div className="p-2 border-b border-gray-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSync}
                className="w-full justify-start"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar calendarios
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="p-4 text-center">
              <Loader size="sm" />
              <p className="text-sm text-gray-500 mt-2">Cargando calendarios...</p>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="p-4 text-center">
              <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-2">Error al cargar calendarios</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                Reintentar
              </Button>
            </div>
          )}

          {/* Calendarios disponibles */}
          {!isLoading && !isError && (
            <div className="max-h-64 overflow-y-auto">
              {/* Opción vacía */}
              {allowEmpty && (
                <div
                  onClick={() => handleSelectCalendar(null)}
                  className={cn(
                    "flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100",
                    !selectedCalendar && "bg-blue-50 border-l-4 border-blue-500"
                  )}
                >
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">{emptyLabel}</span>
                </div>
              )}

              {/* Lista de calendarios */}
              {calendars.length > 0 ? (
                calendars.map(renderCalendarOption)
              ) : (
                <div className="p-4 text-center">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No se encontraron calendarios
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {onlyWritable ? "Sin calendarios con permisos de escritura" : "Sin calendarios disponibles"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer con info */}
          {!isLoading && !isError && calendars.length > 0 && (
            <div className="p-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {calendars.length} calendario{calendars.length !== 1 ? 's' : ''} disponible{calendars.length !== 1 ? 's' : ''}
                {onlyWritable && " · Solo con permisos de escritura"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CalendarSelector;