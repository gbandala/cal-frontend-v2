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
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";




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


  const queryClient = useQueryClient();
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

  const location = useLocation();
  useEffect(() => {
    // Si hay fecha en la URL pero no está seleccionada en el estado
    if (!selectedDate && location.search.includes('date=')) {
      // Extraer fecha de la URL
      const urlParams = new URLSearchParams(location.search);
      const dateParam = urlParams.get('date');

      if (dateParam) {
        // Convertir la fecha de la URL a CalendarDate
        const [year, month, day] = dateParam.split('-').map(Number);
        const newDate = new CalendarDate(year, month, day);

        console.log("📅 Inicializando fecha desde URL:", dateParam);
        handleSelectDate(newDate);
      }
    }
  }, []); // Solo ejecutar una vez al montar

  // 🔄 OBTENER DISPONIBILIDAD DEL EVENTO
  // Esta query obtiene todos los días y horarios disponibles para el evento específico
  const { data, isFetching, isError, error } = useQuery({
    queryKey: [
      "availability_single_event",
      eventId,
      timezone,
      selectedDate && format(selectedDate.toDate(timezone), "yyyy-MM-dd")
    ],
    queryFn: () => {
      // Siempre forzar la fecha en la consulta
      const dateParam = selectedDate
        ? format(selectedDate.toDate(timezone), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"); // Fallback a hoy

      return getPublicAvailabilityByEventIdQueryFn(
        eventId,
        timezone,
        dateParam // Siempre incluir fecha
      );
    },
    enabled: !!eventId, // Sólo verificar que haya eventId, no requerir selectedDate
    refetchOnWindowFocus: false,
    staleTime: 0,
    // Remover cacheTime: 0 - era demasiado agresivo
  });
  const availability = data?.data || [];

  // 🎯 LÓGICA CENTRAL: OBTENER SLOTS PARA FECHA SELECCIONADA

  const timeSlots = useMemo(() => {
    if (!selectedDate || !data?.data) return [];

    // Obtener la fecha en formato string
    const selectedDateStr = format(selectedDate.toDate(timezone), "yyyy-MM-dd");
    console.log("🔍 Buscando disponibilidad para fecha:", selectedDateStr);

    // Buscar día por fecha exacta (prioridad)
    const exactDateMatch = data.data.find(day => day.dateStr === selectedDateStr);

    if (exactDateMatch) {
      console.log("✅ Encontrada disponibilidad por fecha exacta:", {
        slots: exactDateMatch.slots?.length || 0
      });
      return exactDateMatch.slots || [];
    }

    // Fallback: buscar por día de la semana
    const dayOfWeek = format(selectedDate.toDate(timezone), "EEEE").toUpperCase();
    const dayOfWeekMatch = data.data.find(day => day.day === dayOfWeek);

    if (dayOfWeekMatch) {
      console.log("⚠️ Usando fallback por día de semana:", {
        day: dayOfWeek,
        slots: dayOfWeekMatch.slots?.length || 0
      });
      return dayOfWeekMatch.slots || [];
    }

    console.log("❌ No se encontró disponibilidad");
    return [];
  }, [selectedDate, data, timezone]); // Dependencias importantes

  useEffect(() => {
    if (selectedDate) {
      const formattedDate = format(selectedDate.toDate(timezone), "yyyy-MM-dd");
      console.log(`📅 Fecha seleccionada activa: ${formattedDate}`);

      // No invalidar aquí para evitar ciclos innecesarios
      // La invalidación ya ocurre en handleChangeDate
    }
  }, [selectedDate, timezone]);

  // 🚫 FUNCIÓN PARA DETERMINAR SI UNA FECHA ESTÁ DESHABILITADA
  // Esta función se ejecuta para cada día visible en el calendario
  const isDateUnavailable = (date: DateValue) => {
    // 1. Obtener el día de la semana para la fecha dada
    // const day = date.toDate(timezone);
    // const dayOfWeek = format(
    //   date.toDate(timezone), // Convertir a Date objeto en la zona horaria
    //   "EEEE"                 // Formato completo del día (ej: "Monday")
    // ).toUpperCase();          // Convertir a mayúsculas para consistencia

    // console.log('dayOfWeek:',dayOfWeek);
    // 2. Buscar si ese día tiene disponibilidad configurada
    // const dayAvailability = availability.find((day) => day.day === dayOfWeek);

    // 3. La fecha está no disponible si:
    //    - No existe configuración para ese día, O
    //    - La configuración existe pero isAvailable = false
    // return !dayAvailability?.isAvailable;
    return false; // Ninguna fecha está deshabilitada
  };

  // 📅 MANEJAR CAMBIO DE FECHA
  // Cuando el usuario hace clic en una fecha diferente
  const handleChangeDate = (newDate: DateValue) => {
    const calendarDate = newDate as CalendarDate;

    // Primero limpiar el slot seleccionado
    handleSelectSlot(null);

    // Formatear la fecha para logs
    const formattedDate = format(calendarDate.toDate(timezone), "yyyy-MM-dd");
    console.log(`📅 Cambiando fecha a: ${formattedDate}`);

    // Actualizar el estado de fecha
    handleSelectDate(calendarDate);

    // Forzar recarga de datos - importante!
    setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: ["availability_single_event"]
      });
    }, 50); // Pequeño timeout para asegurar que el estado se actualiza primero
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
              onChange={(date) => {
                console.log("📆 Cambio de fecha desde Calendar:", format(date.toDate(timezone), "yyyy-MM-dd"));
                handleChangeDate(date);
              }}         // Callback cuando cambia la fecha
              isDateUnavailable={isDateUnavailable} // Función para deshabilitar fechas
            />
          </div>

          {/* 🕐 PANEL DE HORARIOS DISPONIBLES */}
          {/* Solo se muestra si hay una fecha seleccionada Y datos de disponibilidad */}
          {selectedDate && availability ? (
            <div className="w-full flex-shrink-0 mt-3 lg:mt-0 max-w-xs md:max-w-[40%] pt-0 overflow-hidden md:ml-[-15px]">
              {/* Overlay durante carga */}
              {isFetching && (
                <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10">
                  <Loader size="md" color="black" />
                </div>
              )}
              {/* 📊 ENCABEZADO DEL PANEL DE HORARIOS */}
              <div className="w-full pb-3 flex flex-col md:flex-row justify-between pr-8">
                {/* Fecha seleccionada */}
                <div className="flex flex-col">
                  <h3 className="mt-0 mb-[5px] font-normal text-base leading-[38px]">
                    {format(selectedDate.toDate(timezone), "EEEE d")}
                  </h3>

                  {/* Información de zona horaria */}
                  <div className="text-xs text-gray-500 mb-1">
                    {timezone.replace(/_/g, ' ')}
                  </div>
                </div>

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
                          className={`absolute inset-0 z-20 flex items-center gap-1.5 justify-between transform transition-all duration-400 ease-in-out ${selectedTime === formattedSlot
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
                           ${selectedTime === formattedSlot
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
