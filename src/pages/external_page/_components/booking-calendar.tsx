import { format } from "date-fns";
import { Calendar } from "@/components/calendar";
import { CalendarDate, DateValue } from "@internationalized/date";
import { useBookingState } from "@/hooks/use-booking-state";
import { decodeSlot, formatSlot } from "@/lib/helper";
import { getPublicAvailabilityByEventIdQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Loader } from "@/components/loader";
import HourButton from "@/components/HourButton";

interface BookingCalendarProps {
  eventId: string;
  minValue?: DateValue;
  defaultValue?: DateValue;
}

const BookingCalendar = ({
  eventId,
  minValue,
  defaultValue,
}: BookingCalendarProps) => {
  // 🎯 ESTADO GLOBAL DEL PROCESO DE RESERVA
  // Este hook maneja todo el estado relacionado con la selección de fecha/hora
  const {
    timezone,           // Zona horaria del usuario (ej: "America/Mexico_City")
    hourType,          // Formato de hora: "12h" (AM/PM) o "24h" 
    selectedDate,      // Fecha seleccionada por el usuario (CalendarDate)
    selectedSlot,      // Slot de hora seleccionado (string codificado)
    handleSelectDate,  // Función para cambiar la fecha seleccionada
    handleSelectSlot,  // Función para cambiar el slot de hora
    handleNext,        // Función para avanzar al formulario de datos
    setHourType,       // Función para cambiar formato de hora
  } = useBookingState();

  // 🔄 OBTENER DISPONIBILIDAD DEL EVENTO
  // Esta query obtiene todos los días y horarios disponibles para el evento específico
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["availbility_single_event", eventId], // Cache key único por evento
    queryFn: () => getPublicAvailabilityByEventIdQueryFn(eventId),
  });

  // 📅 ESTRUCTURA DE DATOS DE DISPONIBILIDAD
  // La respuesta del backend tiene esta estructura:
  // [
  //   { 
  //     day: "MONDAY", 
  //     isAvailable: true, 
  //     slots: ["09:00", "10:00", "11:00"] 
  //   },
  //   { 
  //     day: "TUESDAY", 
  //     isAvailable: false, 
  //     slots: [] 
  //   }
  // ]
  const availability = data?.data || [];

  // 🎯 LÓGICA CENTRAL: OBTENER SLOTS PARA FECHA SELECCIONADA
  // Cuando el usuario selecciona una fecha, esta lógica encuentra los horarios disponibles
  const timeSlots = selectedDate
    ? (() => {
        // 1. Convertir la fecha seleccionada a día de la semana en inglés mayúscula
        const dayOfWeek = format(selectedDate.toDate(timezone), "EEEE").toUpperCase();
        // Ejemplo: Si selecciona Lunes, dayOfWeek = "MONDAY"
        
        // 2. Buscar en la disponibilidad el día correspondiente
        const dayAvailability = availability?.find(day => day.day === dayOfWeek);
        
        // 3. Retornar los slots disponibles para ese día (o array vacío si no hay)
        return dayAvailability?.slots || [];
      })()
    : []; // Si no hay fecha seleccionada, no hay slots

  // 🚫 FUNCIÓN PARA DETERMINAR SI UNA FECHA ESTÁ DESHABILITADA
  // Esta función se ejecuta para cada día visible en el calendario
  const isDateUnavailable = (date: DateValue) => {
    // 1. Obtener el día de la semana para la fecha dada
    const dayOfWeek = format(
      date.toDate(timezone), // Convertir a Date objeto en la zona horaria
      "EEEE"                 // Formato completo del día (ej: "Monday")
    ).toUpperCase();          // Convertir a mayúsculas para consistencia

    // 2. Buscar si ese día tiene disponibilidad configurada
    const dayAvailability = availability.find((day) => day.day === dayOfWeek);
    
    // 3. La fecha está no disponible si:
    //    - No existe configuración para ese día, O
    //    - La configuración existe pero isAvailable = false
    return !dayAvailability?.isAvailable;
  };

  // 📅 MANEJAR CAMBIO DE FECHA
  // Cuando el usuario hace clic en una fecha diferente
  const handleChangeDate = (newDate: DateValue) => {
    const calendarDate = newDate as CalendarDate;
    
    // 1. Limpiar cualquier slot de hora previamente seleccionado
    //    (porque los slots cambian según el día)
    handleSelectSlot(null);
    
    // 2. Actualizar la fecha seleccionada en el estado global
    handleSelectDate(calendarDate);
  };

  // 🕐 DECODIFICAR SLOT SELECCIONADO PARA MOSTRAR
  // Los slots se almacenan codificados, esta función los convierte a formato legible
  const selectedTime = decodeSlot(selectedSlot, timezone, hourType);
  // Ejemplo: slot "14:30" + timezone + "12h" = "2:30 PM"

  return (
    <div className="relative lg:flex-[1_1_50%] w-full flex-shrink-0 transition-all duration-220 ease-out p-4 pr-0">
      {/* 🔄 OVERLAY DE CARGA */}
      {/* Mostrar spinner cuando se están obteniendo los datos de disponibilidad */}
      {isFetching && (
        <div className="flex bg-white/60 !z-30 absolute w-[95%] h-full items-center justify-center">
          <Loader size="lg" color="black" />
        </div>
      )}

      <div className="flex flex-col h-full mx-auto pt-[25px]">
        <h2 className="text-xl mb-5 font-bold">Select a Date &amp; Time</h2>
        
        <div className="w-full flex flex-col md:flex-row lg:flex-[1_1_300px]">
          
          {/* 📅 COMPONENTE DE CALENDARIO */}
          <div className="w-full flex justify-start max-w-xs md:max-w-full lg:max-w-sm">
            <Calendar
              className="w-auto md:w-full lg:!w-auto"
              minValue={minValue}                    // Fecha mínima seleccionable (ej: hoy)
              defaultValue={defaultValue}           // Fecha por defecto (ej: hoy)
              value={selectedDate}                  // Fecha actualmente seleccionada
              timezone={timezone}                   // Zona horaria para conversiones
              onChange={handleChangeDate}          // Callback cuando cambia la fecha
              isDateUnavailable={isDateUnavailable} // Función para deshabilitar fechas
            />
          </div>

          {/* 🕐 PANEL DE HORARIOS DISPONIBLES */}
          {/* Solo se muestra si hay una fecha seleccionada Y datos de disponibilidad */}
          {selectedDate && availability ? (
            <div className="w-full flex-shrink-0 mt-3 lg:mt-0 max-w-xs md:max-w-[40%] pt-0 overflow-hidden md:ml-[-15px]">
              
              {/* 📊 ENCABEZADO DEL PANEL DE HORARIOS */}
              <div className="w-full pb-3 flex flex-col md:flex-row justify-between pr-8">
                {/* Mostrar la fecha seleccionada en formato legible */}
                <h3 className="mt-0 mb-[10px] font-normal text-base leading-[38px]">
                  {format(selectedDate.toDate(timezone), "EEEE d")}
                  {/* Ejemplo: "Monday 15" */}
                </h3>

                {/* 🔧 SELECTOR DE FORMATO DE HORA */}
                <div className="flex h-9 w-full max-w-[107px] items-center border rounded-sm">
                  <HourButton
                    label="12h"
                    isActive={hourType === "12h"}
                    onClick={() => setHourType("12h")}
                  />
                  <HourButton
                    label="24h"
                    isActive={hourType === "24h"}
                    onClick={() => setHourType("24h")}
                  />
                </div>
              </div>

              {/* 📋 LISTA DE SLOTS DE TIEMPO DISPONIBLES */}
              <div className="flex-[1_1_100px] pr-[8px] overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-track-transparent scroll--bar h-[400px]">
                
                {/* 🔄 RENDERIZAR CADA SLOT DISPONIBLE */}
                {timeSlots.map((slot, i) => {
                  // Formatear el slot según zona horaria y formato de hora seleccionado
                  const formattedSlot = formatSlot(slot, timezone, hourType);
                  // Ejemplo: "14:30" -> "2:30 PM" (si hourType = "12h")

                  return (
                    <div role="list" key={i}>
                      <div role="listitem" className="m-[10px_10px_10px_0] relative text-[15px]">
                        
                        {/* 🎯 BOTONES CUANDO EL SLOT ESTÁ SELECCIONADO */}
                        {/* Esta sección se anima y aparece cuando el usuario selecciona un horario */}
                        <div
                          className={`absolute inset-0 z-20 flex items-center gap-1.5 justify-between transform transition-all duration-400 ease-in-out ${
                            selectedTime === formattedSlot
                              ? "translate-x-0 opacity-100"    // Visible si está seleccionado
                              : "translate-x-full opacity-0"   // Oculto si no está seleccionado
                          }`}
                        >
                          {/* Botón que muestra la hora seleccionada (deshabilitado, solo visual) */}
                          <button
                            type="button"
                            className="w-full h-[52px] text-white rounded-[4px] bg-black/60 font-semibold disabled:opacity-100 disabled:pointer-events-none tracking-wide"
                            disabled
                          >
                            {formattedSlot}
                          </button>
                          
                          {/* Botón "Next" para continuar al formulario */}
                          <button
                            type="button"
                            className="w-full cursor-pointer h-[52px] bg-[rgb(0,105,255)] text-white rounded-[4px] hover:bg-[rgba(0,105,255,0.8)] font-semibold tracking-wide"
                            onClick={handleNext}
                          >
                            Next
                          </button>
                        </div>

                        {/* 🕐 BOTÓN DE SLOT DE TIEMPO PRINCIPAL */}
                        {/* Este es el botón que el usuario hace clic para seleccionar un horario */}
                        <button
                          type="button"
                          className={`w-full h-[52px] cursor-pointer border border-[rgba(0,105,255,0.5)] text-[rgb(0,105,255)] rounded-[4px] font-semibold hover:border-2 hover:border-[rgb(0,105,255)] tracking-wide transition-all duration-400 ease-in-out
                           ${
                             selectedTime === formattedSlot
                               ? "opacity-0"      // Se oculta cuando está seleccionado
                               : "opacity-100"    // Visible cuando no está seleccionado
                           }`}
                          onClick={() => handleSelectSlot(slot)}
                        >
                          {formattedSlot}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ⚠️ MOSTRAR ERRORES SI OCURREN */}
      <ErrorAlert isError={isError} error={error} />
    </div>
  );
};

export default BookingCalendar;

/*
🎯 RESUMEN DEL FLUJO DE OBTENCIÓN DE ESPACIOS DISPONIBLES:

1. **INICIALIZACIÓN**
   - Se recibe eventId como prop
   - Se obtiene estado global (fecha, hora, timezone) del hook useBookingState

2. **CARGA DE DISPONIBILIDAD**
   - useQuery hace llamada a getPublicAvailabilityByEventIdQueryFn(eventId)
   - El backend retorna array con disponibilidad por día de semana
   - Estructura: [{ day: "MONDAY", isAvailable: true, slots: ["09:00", "10:00"] }]

3. **FILTRADO POR FECHA**
   - Cuando usuario selecciona fecha, se convierte a día de semana
   - Se busca en el array de disponibilidad el día correspondiente
   - Se obtienen los slots disponibles para ese día específico

4. **VALIDACIÓN DE FECHAS**
   - isDateUnavailable() verifica si una fecha está disponible
   - Se ejecuta para cada día visible en el calendario
   - Retorna true/false para habilitar/deshabilitar fechas

5. **SELECCIÓN DE HORARIO**
   - timeSlots contiene los horarios disponibles para la fecha seleccionada
   - Se renderizan como botones clicables
   - Al seleccionar, se guarda en estado global y se muestra botón "Next"

6. **FORMATEO Y PRESENTACIÓN**
   - Los slots se formatean según zona horaria y preferencia 12h/24h
   - Se manejan animaciones para mejorar UX
   - Se proporciona feedback visual del estado de selección

🔄 FLUJO DE DATOS:
Backend → useQuery → availability array → filtrado por fecha → timeSlots → renderizado

🎨 UX CONSIDERATIONS:
- Loading states durante carga de datos
- Fechas deshabilitadas visualmente en calendario  
- Animaciones suaves entre estados
- Feedback inmediato al seleccionar horarios
- Manejo de errores con componente dedicado
*/