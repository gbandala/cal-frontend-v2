import { useQuery } from "@tanstack/react-query";
import PageTitle from "@/components/PageTitle";
import { Card, CardContent } from "@/components/ui/card";
import WeeklyHoursRow from "./_components/weekly-hours";
import { Separator } from "@/components/ui/separator";
import { ClockIcon } from "lucide-react";
import { getUserAvailabilityQueryFn } from "@/lib/api";
import { Loader } from "@/components/loader";
import { ErrorAlert } from "@/components/ErrorAlert";

const Availability = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user_availability"],
    queryFn: getUserAvailabilityQueryFn,
  });

  // 🔧 FIX: Cambiar la lógica de acceso a los datos
  const getAvailabilityData = () => {
    if (!data) return { days: [], timeGap: 30 };

    // 🐛 DEBUG: Mostrar estructura real de datos
    console.log("🔍 [DEBUG] Raw data from API:", data);
    console.log("🔍 [DEBUG] Data keys:", data ? Object.keys(data) : "no data");

    // ✅ CORRECCIÓN: Los datos están en data.availability directamente
    if (data.availability?.days && Array.isArray(data.availability.days)) {
      console.log("✅ [DEBUG] Found availability data:", {
        daysCount: data.availability.days.length,
        timeGap: data.availability.timeGap
      });
      
      return {
        days: data.availability.days,
        timeGap: data.availability.timeGap || 30
      };
    }

    return { days: [], timeGap: 30 };
  };

  const { days, timeGap } = getAvailabilityData();


  return (
    <div className="flex flex-col !gap-3">
      <PageTitle title="Availability" />

      <ErrorAlert isError={isError} error={error} />

      <div className="w-full">
        {isLoading || isError ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Loader size="lg" color="black" />
          </div>
        ) : (
          <Card className="p-0 shadow-[0_1px_6px_0_rgb(0_0_0_/_10%)]min-h-[220px] border border-[#D4E16F)] bg-white rounded-[8px]">
            <CardContent className="!py-[24px] px-0 !pb-10">
              <div>
                <fieldset>
                  <legend>
                    <h3 className="text-lg px-[24px] inline-flex gap-1 font-bold tracking-wide mb-3">
                      <ClockIcon />
                      <span>Weekly hours</span>
                    </h3>
                  </legend>
                  <Separator className="bg-[#D4E16F]" />
                  
                  {/* 🔍 DEBUG: Mostrar información útil */}
                  {/* <div className="text-sm text-gray-500 px-[24px] py-2">
                    Debug: Found {days.length} days, TimeGap: {timeGap}min
                    <br />
                    Available days: {days.filter(d => d.isAvailable).length}
                  </div> */}
                  
                  <div className="w-full max-w-lg px-[24px]">
                    {days.length > 0 ? (
                      <WeeklyHoursRow days={days} timeGap={timeGap} />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No availability data found</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Check API response structure in console
                        </p>
                      </div>
                    )}
                  </div>
                </fieldset>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Availability;