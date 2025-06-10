import { z } from "zod";
// import { addMinutes, parseISO } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useBookingState } from "@/hooks/use-booking-state";
import { Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { CheckIcon, ExternalLink } from "lucide-react";
import { scheduleMeetingMutationFn } from "@/lib/api";
import { toast } from "sonner";
import { Loader } from "@/components/loader";




const BookingForm = (props: { eventId: string; duration: number }) => {
  const { eventId, duration } = props;
  const [meetLink, setMeetLink] = useState("");

  const { timezone, selectedDate, isSuccess, selectedSlot, handleSuccess } =
    useBookingState();

  // const { mutate, isPending } = useMutation({
  //   mutationFn: scheduleMeetingMutationFn,
  // });

  const { mutate, isPending } = useMutation({
  mutationFn: (data: BookingFormData & { eventId: string; startTime: string; endTime: string; timezone: string }) => 
    scheduleMeetingMutationFn(data, data.timezone),
});

  const bookingFormSchema = z.object({
    guestName: z.string().min(1, "Name is required"),
    guestEmail: z.string().email("Invalid email address"),
    additionalInfo: z.string().optional(),
  });

  type BookingFormData = z.infer<typeof bookingFormSchema>;

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      additionalInfo: "",
    },
  });

  const onSubmit = (values: BookingFormData) => {
    if (!eventId || !selectedSlot || !selectedDate) return;

    // Decode the selected slot to get the slotDate
    const decodedSlotDate = decodeURIComponent(selectedSlot);
    // console.log('decodedSlotDate:', decodedSlotDate);

    // Usar la string directamente para startTime
    const startTimeString = decodedSlotDate; // "2025-06-25T15:00:00.000Z"
    // console.log('startTimeString:', startTimeString);

    // Extraer componentes de la fecha UTC para calcular endTime
    const dateMatch = startTimeString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!dateMatch) throw new Error('Invalid date format');

    const [, year, month, day, hours, minutes] = dateMatch;

    // Crear endTime usando Date.UTC para forzar interpretación UTC
    const endTime = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1, // Date.UTC months are 0-indexed
      parseInt(day),
      parseInt(hours),
      parseInt(minutes) + duration // Añadir duración aquí
    ));

    const endTimeString = endTime.toISOString().slice(0, 16);
    const payload = {
      ...values,
      eventId,
      startTime: startTimeString,  // 👈 String original del estado
      endTime: endTimeString,      // 👈 Calculada con timestamp
      timezone: timezone,
    };

    // console.log("Form Data:", payload);
    console.log("startTime should be:", startTimeString);
    console.log("endTime calculated:", endTimeString);

    if (isPending) return;

    mutate(payload, {
      onSuccess: (response) => {
        console.log(response);
        setMeetLink(response.data.meetLink);
        handleSuccess(true);
      },
      onError: (error) => {
        console.log(error);
        toast.error(error.message || "Failed to schedule event");
      },
    });
  };
  return (
    <div className="max-w-md pt-6 px-6">
      {isSuccess ? (
        // Success Message Component
        <div className="text-center pt-4">
          <h2 className="text-2xl flex items-center justify-center gap-2 font-bold mb-4">
            <span className="size-5 flex items-center justify-center rounded-full bg-green-700">
              <CheckIcon className="w-3 h-3 !stroke-4 text-white " />
            </span>
            You are scheduled
          </h2>
          <p className="mb-4">Your meeting has been scheduled successfully.</p>
          <p className="flex items-center text-sm  justify-center gap-2 mb-4">
            Copy link:
            <span className="font-normal text-primary">{meetLink}</span>
          </p>
          <a href={meetLink} target="_blank" rel="noopener noreferrer">
            <Button>
              <ExternalLink className="w-4 h-4" />
              <span>Join Google Meet</span>
            </Button>
          </a>
        </div>
      ) : (
        <Fragment>
          <h2 className="text-xl font-bold mb-6">Enter Details</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <FormField
                name="guestName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold !text-base text-[#0a2540]">
                      Name
                    </Label>
                    <FormControl className="mt-1">
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                name="guestEmail"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold !text-base text-[#0a2540]">
                      Email
                    </Label>
                    <FormControl className="mt-1">
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional Info Field */}
              <FormField
                name="additionalInfo"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-semibold !text-base text-[#0a2540] ">
                      Additional notes
                    </Label>
                    <FormControl className="mt-1">
                      <Textarea
                        placeholder="Please share anything that will help prepare for our meeting."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button disabled={isPending} type="submit">
                {isPending ? <Loader color="white" /> : "Schedule Meeting"}
              </Button>
            </form>
          </Form>
        </Fragment>
      )}
    </div>
  );
};

export default BookingForm;
