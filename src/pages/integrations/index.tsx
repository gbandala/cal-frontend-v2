
import PageTitle from "@/components/PageTitle";
import IntegrationCard from "./_components/integration-card";
import { useQuery } from "@tanstack/react-query";
import { getAllIntegrationQueryFn } from "@/lib/api";
import { Loader } from "@/components/loader";
import { ErrorAlert } from "@/components/ErrorAlert";

const Integrations = () => {
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["integration_list"],
    queryFn: getAllIntegrationQueryFn,
  });

  // console.log("🔍 [DEBUG] Fetching integrations data...",integrations.values());
  // 🔧 FIX: Cambiar data?.integrations por data?.data
  const integrations = data?.integrations || [];

  // 🐛 DEBUG: Agregar logs para verificar la estructura de datos
  console.log("🔍 [DEBUG] Raw data from API:", data);
  console.log("🔍 [DEBUG] Processed integrations:", integrations);
  console.log("🔍 [DEBUG] Integration count:", integrations.length);

  return (
    <div className="flex flex-col !gap-5">
      <PageTitle
        title="Integrations & apps"
        subtitle="Connect all your apps directly from here. You need to connect these apps"
      />

      <ErrorAlert isError={isError} error={error} />

      <div className="relative flex flex-col gap-4">
        <section className="flex flex-col gap-4 text-muted-foreground">
          {isFetching || isError ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <Loader size="lg" color="black" />
            </div>
          ) : (
            <>
              {/* 🔍 DEBUG: Mostrar información de debug */}
              {/* <div className="text-sm text-gray-500 mb-2">
                Debug: Found {integrations.length} integrations
              </div> */}
              
              <div className="space-y-4">
                {integrations.length > 0 ? (
                  integrations.map((integration) => (
                    <IntegrationCard
                      key={integration.app_type}
                      isDisabled={
                        integration.app_type === "GOOGLE_MEET_AND_CALENDAR"
                          ? false
                          : false
                      }
                      appType={integration.app_type}
                      title={integration.title}
                      isConnected={integration.isConnected}
                    />
                  ))
                ) : (
                  // 📝 Mostrar mensaje si no hay integraciones
                  <div className="text-center py-8">
                    <p className="text-gray-500">No integrations found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Check API response structure in console
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Integrations;