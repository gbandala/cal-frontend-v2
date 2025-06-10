import { parseAsBoolean, useQueryState } from "nuqs";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { parse } from "date-fns";
// import { toZonedTime } from "date-fns-tz";

export const useBookingState = () => {



  const [selectedDate, setSelectedDate] = useQueryState<CalendarDate>("date", {
    parse: (value) =>
      new CalendarDate(
        parseInt(value.split("-")[0]),
        parseInt(value.split("-")[1]),
        parseInt(value.split("-")[2])
      ),
    serialize: (value) => `${value.year}-${value.month}-${value.day}`,
  });
  const [selectedSlot, setSelectedSlot] = useQueryState("slot");

  const [next, setNext] = useQueryState(
    "next",
    parseAsBoolean.withDefault(false)
  );

  const [timezone, setTimezone] = useQueryState("timezone", {
    defaultValue: getLocalTimeZone(), // Default to user's system timezone
  });


  const [hourType, setHourType] = useQueryState<"12h" | "24h">("hourType", {
    defaultValue: "24h",
    parse: (value) => (value === "12h" ? "12h" : "24h"),
    serialize: (value) => value,
  });

  const [isSuccess, setIsSuccess] = useQueryState(
    "success",
    parseAsBoolean.withDefault(false)
  );

  const handleSelectDate = (date: CalendarDate) => {
    setSelectedDate(date);
  };

  const handleSelectSlot = (slot: string | null) => {
    if (!selectedDate || !slot) {
      setSelectedSlot(null);
      return;
    }

    // Parse the slot time (e.g., "09:00") 
    const parsedSlotTime = parse(slot, "HH:mm", new Date());
    // console.log('horario:', parsedSlotTime);

    // Build the date directly in UTC
    const year = selectedDate.year;
    const month = selectedDate.month.toString().padStart(2, '0');
    const day = selectedDate.day.toString().padStart(2, '0');
    const hours = parsedSlotTime.getHours().toString().padStart(2, '0');
    const minutes = parsedSlotTime.getMinutes().toString().padStart(2, '0');

    // Create UTC datetime string directly
    const utcDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;

    // console.log('UTC datetime:', utcDateTimeString);

    const encodedSlot = encodeURIComponent(utcDateTimeString);
    // console.log('encodedSlot:', encodedSlot);
    setSelectedSlot(encodedSlot);
  };
  const handleNext = () => {
    setNext(true);
  };

  const handleBack = () => {
    setNext(false);
  };

  const handleSuccess = (value: boolean) => {
    setIsSuccess(value || true);
  };
  return {
    selectedDate,
    selectedSlot,
    next: next,
    timezone,
    hourType,
    isSuccess,
    handleSelectDate,
    handleSelectSlot,
    handleNext,
    handleBack,
    handleSuccess,
    setTimezone,
    setHourType,
  };
};
