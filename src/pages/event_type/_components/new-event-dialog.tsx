import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "lucide-react";
import { locationOptions, VideoConferencingPlatform } from "@/lib/types";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PROTECTED_ROUTES } from "@/routes/common/routePaths";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkIntegrationQueryFn, CreateEventMutationFn } from "@/lib/api";
import { toast } from "sonner";
import { Loader } from "@/components/loader";
import CalendarSelector from "@/components/calendar-selector";

const NewEventDialog = (props: { btnVariant?: string }) => {
  const { btnVariant } = props;

  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: CreateEventMutationFn,
  });

  const [selectedLocationType, setSelectedLocationType] =
    useState<VideoConferencingPlatform | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // ✅ CAMBIO: Estado específico por plataforma
  const [connectionStatus, setConnectionStatus] = useState<{
    [key in VideoConferencingPlatform]?: boolean;
  }>({});

  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Calendar selection state
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [selectedCalendarName, setSelectedCalendarName] = useState<string>("");

  const eventSchema = z.object({
    title: z.string().min(1, "Event name is required"),
    duration: z
      .number()
      .int({ message: "Duration must be a number" })
      .min(1, "Duration is required"),
    description: z.string().optional(),
    locationType: z
      .enum([
        VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR,
        VideoConferencingPlatform.ZOOM_MEETING,
        VideoConferencingPlatform.MICROSOFT_TEAMS,
      ])
      .refine((value) => value !== undefined, {
        message: "Location type is required",
      }),
    calendar_id: z.string().optional(),
    calendar_name: z.string().optional(),
  });

  type EventFormData = z.infer<typeof eventSchema>;

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      duration: 30,
      description: "",
      calendar_id: "",
      calendar_name: "",
    },
  });

  const { isValid } = form.formState;

  // ✅ CAMBIO: Función mejorada que maneja múltiples plataformas
  const handleLocationTypeChange = async (value: VideoConferencingPlatform) => {
    setSelectedLocationType(value);
    setError(null);

    // ✅ LIMPIAR campos de calendario si no es Google Meet
    if (value !== VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR) {
      setSelectedCalendarId("");
      setSelectedCalendarName("");
      form.setValue("calendar_id", "");
      form.setValue("calendar_name", "");
    }

    // Si ya está verificado, solo actualizar el form
    if (connectionStatus[value] === true) {
      form.setValue("locationType", value);
      form.trigger("locationType");
      return;
    }

    // Verificar conexión según la plataforma
    if (
      value === VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR ||
      value === VideoConferencingPlatform.ZOOM_MEETING ||
      value === VideoConferencingPlatform.MICROSOFT_TEAMS
    ) {
      setIsChecking(true);
      try {
        const { isConnected } = await checkIntegrationQueryFn(value);

        if (!isConnected) {
          const platformName = getPlatformName(value);
          setError(
            `${platformName} is not connected. <a href=${PROTECTED_ROUTES.INTEGRATIONS} target="_blank" class='underline text-primary'>Visit the integration page</a> to connect your account.`
          );
          setConnectionStatus(prev => ({ ...prev, [value]: false }));
          return;
        }

        // ✅ Marcar como conectado y actualizar form
        setConnectionStatus(prev => ({ ...prev, [value]: true }));
        form.setValue("locationType", value);
        form.trigger("locationType");

      } catch (error) {
        console.log(error);
        const platformName = getPlatformName(value);
        setError(`Failed to check ${platformName} integration status.`);
        setConnectionStatus(prev => ({ ...prev, [value]: false }));
      } finally {
        setIsChecking(false);
      }
    } else {
      // Para plataformas que no requieren verificación
      form.setValue("locationType", value);
      form.trigger("locationType");
    }
  };

  // ✅ NUEVA: Helper function para obtener nombres de plataforma
  const getPlatformName = (platform: VideoConferencingPlatform): string => {
    switch (platform) {
      case VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR:
        return "Google Meet";
      case VideoConferencingPlatform.ZOOM_MEETING:
        return "Zoom";
      case VideoConferencingPlatform.MICROSOFT_TEAMS:
        return "Microsoft Teams";
      default:
        return "Platform";
    }
  };

  // ✅ NUEVA: Helper para verificar si una plataforma está conectada
  const isPlatformConnected = (platform: VideoConferencingPlatform): boolean => {
    return connectionStatus[platform] === true;
  };

  // ✅ NUEVA: Helper para verificar si la plataforma seleccionada está conectada
  const isSelectedPlatformConnected = (): boolean => {
    if (!selectedLocationType) return false;
    return isPlatformConnected(selectedLocationType);
  };

  const handleCalendarChange = (calendarId: string, calendarName: string) => {
    setSelectedCalendarId(calendarId);
    setSelectedCalendarName(calendarName);
    form.setValue("calendar_id", calendarId);
    form.setValue("calendar_name", calendarName);
  };

  const handleCalendarError = (error: unknown) => {
    console.error("❌ [CALENDAR_ERROR] Error en selector de calendario:", error);
    toast.error("Error al cargar calendarios. Se usará el calendario principal.");
  };

  const onSubmit = (data: EventFormData) => {
    const baseData = {
      title: data.title,
      duration: data.duration,
      description: data.description || "",
      locationType: data.locationType,
    };

    // ✅ Solo incluir calendar_id y calendar_name para Google Meet
    const submitData = data.locationType === VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR
      ? {
        ...baseData,
        calendar_id: data.calendar_id ? data.calendar_id : undefined, // Usar undefined si está vacío
        calendar_name: data.calendar_name ? data.calendar_name : undefined,
      }
      : {
        ...baseData,
        // ✅ Para Zoom y otras plataformas, NO enviar calendar_id/calendar_name
        calendar_id: undefined,
        calendar_name: undefined,
      };

    console.log("📝 [SUBMIT_EVENT] Datos preparados para envío:", {
      platform: data.locationType,
      includesCalendar: data.locationType === VideoConferencingPlatform.GOOGLE_MEET_AND_CALENDAR,
      submitData
    });

    mutate(
      submitData,
      {
        onSuccess: (response) => {
          queryClient.invalidateQueries({
            queryKey: ["event_list"],
          });

          // Reset all states
          setSelectedCalendarId("");
          setSelectedCalendarName("");
          setSelectedLocationType(null);
          setConnectionStatus({});
          setError(null);
          setIsOpen(false);
          form.reset();

          console.log("✅ [EVENT_CREATED] Evento creado exitosamente", {
            eventId: response.event?.id,
            calendarUsed: response.event?.calendar_id || "primary",
            calendarName: response.event?.calendar_name || "Calendario principal"
          });

          toast.success("Event created successfully");
        },
        onError: (error) => {
          console.error("❌ [EVENT_CREATE_ERROR] Error al crear evento:", error);
          toast.error("Failed to create event");
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={btnVariant ? "default" : "outline"}
          size="lg"
          className={cn(
            `!w-auto !border-[#476788] !text-[#0a2540] !font-normal !text-sm`,
            btnVariant && "!text-white !border-primary"
          )}
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Event Type</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] !px-0 pb-0">
        <DialogHeader className="px-6">
          <DialogTitle className="text-xl">Add a new event type</DialogTitle>
          <DialogDescription>
            Create a new event type for people to book times with.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 px-6">
              <FormField
                name="title"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold !text-base">
                      Event name
                    </Label>
                    <FormControl className="mt-2">
                      <Input placeholder="Name your event" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold !text-base">
                      Description
                    </Label>
                    <FormControl className="mt-2">
                      <Textarea
                        className="focus-visible:ring-ring/0"
                        placeholder="Description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="duration"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold !text-base">Duration</Label>
                    <FormControl className="mt-2">
                      <Input
                        {...field}
                        type="number"
                        placeholder="Duration"
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value) && value > 0) {
                            field.onChange(parseInt(e.target.value, 10));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="locationType"
                control={form.control}
                render={() => (
                  <FormItem>
                    <Label className="font-semibold !text-base">
                      Location Type
                    </Label>
                    <FormControl className="w-full mt-2">
                      <div className="grid grid-cols-4 gap-2">
                        {locationOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={cn(
                              `w-full h-[70px] cursor-pointer border disabled:pointer-events-none border-[#B2B2B2] mx-auto pt-1 pr-0.5 pl-0.5 rounded-[5px] flex flex-col items-center justify-center`,
                              selectedLocationType === option.value &&
                              "border-primary bg-primary/10",
                              !option.isAvailable &&
                              "pointer-events-none !text-gray-400 opacity-80 grayscale",
                              selectedLocationType === option.value &&
                              !!error &&
                              "!border-destructive !bg-destructive/10",
                              // ✅ CAMBIO: Verificar conexión específica por plataforma
                              isPlatformConnected(option.value) &&
                              selectedLocationType === option.value &&
                              "!border-green-500 !bg-green-50"
                            )}
                            disabled={isChecking}
                            // ✅ CAMBIO: Permitir cambiar siempre (quitar la condición !appConnected)
                            onClick={() => {
                              handleLocationTypeChange(option.value);
                            }}
                          >
                            {isChecking &&
                              selectedLocationType === option.value ? (
                              <Loader size="sm" />
                            ) : (
                              <>
                                <img
                                  src={option.logo as string}
                                  alt={option.label}
                                  width="20px"
                                  height="20px"
                                />
                                <span className="mt-1 text-sm">
                                  {option.label}
                                </span>
                                {/* ✅ NUEVO: Indicador visual de estado de conexión */}
                                {isPlatformConnected(option.value) && (
                                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </FormControl>

                    {error ? (
                      <FormMessage>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: error,
                          }}
                        />
                      </FormMessage>
                    ) : (
                      <FormMessage />
                    )}
                  </FormItem>
                )}
              />

              <FormField
                name="calendar_id"
                control={form.control}
                render={() => (
                  <FormItem>
                    <Label className="font-semibold !text-base">
                      Calendar
                      <span className="font-normal text-sm text-gray-500 ml-2">
                        (Optional - defaults to primary calendar)
                      </span>
                    </Label>
                    <FormControl className="mt-2">
                      <CalendarSelector
                        value={selectedCalendarId}
                        onChange={handleCalendarChange}
                        onlyWritable={true}
                        onlyActive={true}
                        allowEmpty={true}
                        emptyLabel="Use primary calendar"
                        placeholder="Select a specific calendar"
                        showSyncButton={true}
                        onError={handleCalendarError}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedCalendarId ? (
                        <span>
                          📅 Meetings will be created in: <strong>{selectedCalendarName}</strong>
                        </span>
                      ) : (
                        <span>
                          📅 Meetings will be created in your primary calendar
                        </span>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter
              className="bg-[#f6f7f9] border-t px-6 py-3 !mt-6
             border-[#e5e7eb] rounded-b-[8px]"
            >
              <Button
                type="submit"
                disabled={
                  !isValid ||
                  isPending ||
                  (!!selectedLocationType && !isSelectedPlatformConnected())
                }
              >
                {isPending ? (
                  <Loader size="sm" color="white" />
                ) : (
                  <span>Create</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewEventDialog;