import axios from "axios";
import { useStore } from "@/store/store";
import { CustomError } from "@/types/custom-error.type";
import { ENV } from "./get-env";

// Obtiene la URL base de la API desde las variables de entorno
const baseURL = ENV.VITE_API_BASE_URL;
// console.log("🌐 [CONFIG] Base URL configurada:", baseURL);

// Configuración base para todas las instancias de Axios
const options = {
  baseURL,                    // URL base para todas las peticiones
  withCredentials: true,      // Permite enviar cookies con las peticiones
  timeout: 10000,            // Timeout de 10 segundos para las peticiones
};

// console.log("⚙️ [CONFIG] Opciones de Axios:", options);

//*** INSTANCIA DE API PARA ENDPOINTS QUE REQUIEREN AUTENTICACIÓN */
export const API = axios.create(options);
// console.log("🔐 [INIT] Instancia API autenticada creada");

// Interceptor de REQUEST: Se ejecuta ANTES de enviar cada petición
API.interceptors.request.use((config) => {
  // console.log("🚀 [API REQUEST]", {
  //   method: config.method?.toUpperCase(),
  //   url: config.url,
  //   baseURL: config.baseURL,
  //   fullURL: `${config.baseURL}${config.url}`,
  //   data: config.data,
  //   params: config.params,
  //   headers: { ...config.headers } // Copia para no mutar el original
  // });

  // Obtiene el token de acceso del store global
  const accessToken = useStore.getState().accessToken;
  
  // Si existe un token, lo agrega al header Authorization
  if (accessToken) {
    config.headers["Authorization"] = "Bearer " + accessToken;
    // console.log("🔑 [TOKEN] Agregado al request:", accessToken.substring(0, 10) + "...");
  } else {
    console.log("⚠️ [TOKEN] No se encontró token de acceso");
  }
  
  // Retorna la configuración modificada
  return config;
});

// Interceptor de RESPONSE: Se ejecuta DESPUÉS de recibir cada respuesta
API.interceptors.response.use(
  // Caso exitoso: simplemente retorna la respuesta
  (response) => {
    // console.log("✅ [API RESPONSE SUCCESS]", {
    //   status: response.status,
    //   statusText: response.statusText,
    //   url: response.config.url,
    //   method: response.config.method?.toUpperCase(),
    //   data: response.data,
    //   headers: response.headers,
    //   // duration: response.config.metadata?.requestStartedAt ? 
    //   //   Date.now() - response.config.maxBodyLength..metadata.requestStartedAt + "ms" : "unknown"
    // });
    return response;
  },
  
  // Caso de error: maneja diferentes tipos de errores
  async (error) => {
    console.log("❌ [API RESPONSE ERROR]", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      responseData: error.response?.data,
      requestData: error.config?.data,
      fullError: error
    });

    const { data, status } = error.response;
    
    // Si recibe un 401 (Unauthorized), significa que el token expiró o es inválido
    if (data === "Unauthorized" && status === 401) {
      console.log("🚪 [AUTH] Token expirado o inválido - Iniciando logout");
      
      const store = useStore.getState();
      
      // Limpia toda la información del usuario del store
      store.clearUser();
      store.clearAccessToken();
      store.clearExpiresAt();
      
      console.log("🧹 [AUTH] Store limpiado - Redirigiendo a login");
      
      // Redirige al usuario a la página de login
      window.location.href = "/";
    }

    console.log("🔧 [ERROR PROCESSING] Datos originales del servidor:", data);
    
    // Crea un error personalizado con más información
    const customError: CustomError = {
      ...error,                                    // Mantiene todas las propiedades del error original
      message: data?.message,                      // Extrae el mensaje del servidor
      errorCode: data?.errorCode || "UNKNOWN_ERROR", // Código de error personalizado
    };

    console.log("🔧 [ERROR PROCESSING] Error personalizado creado:", customError);

    // Rechaza la promesa con el error personalizado
    return Promise.reject(customError);
  }
);

//*** INSTANCIA DE API PARA ENDPOINTS PÚBLICOS (SIN AUTENTICACIÓN) */
export const PublicAPI = axios.create(options);
// console.log("🌍 [INIT] Instancia PublicAPI creada");

// Interceptor de REQUEST para PublicAPI (opcional - solo para logging)
PublicAPI.interceptors.request.use((config) => {
  // console.log("🚀 [PUBLIC API REQUEST]", {
  //   method: config.method?.toUpperCase(),
  //   url: config.url,
  //   baseURL: config.baseURL,
  //   fullURL: `${config.baseURL}${config.url}`,
  //   data: config.data,
  //   params: config.params,
  //   headers: { ...config.headers }
  // });
  return config;
});

// Interceptor de respuesta para la API pública
// No tiene interceptor de request porque no necesita token
PublicAPI.interceptors.response.use(
  // Caso exitoso: retorna la respuesta tal como viene
  (response) => {
    // console.log("✅ [PUBLIC API RESPONSE SUCCESS]", {
    //   status: response.status,
    //   statusText: response.statusText,
    //   url: response.config.url,
    //   method: response.config.method?.toUpperCase(),
    //   data: response.data,
    //   headers: response.headers
    // });
    return response;
  },
  
  // Caso de error: similar al anterior pero SIN manejo de 401
  async (error) => {
    console.log("❌ [PUBLIC API RESPONSE ERROR]", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      responseData: error.response?.data,
      requestData: error.config?.data,
      fullError: error
    });

    const { data } = error.response;
    
    console.log("🔧 [PUBLIC ERROR PROCESSING] Datos del servidor:", data);
    
    // Crea un error personalizado con información del servidor
    const customError: CustomError = {
      ...error,
      message: data?.message,
      errorCode: data?.errorCode || "UNKNOWN_ERROR",
    };
    
    console.log("🔧 [PUBLIC ERROR PROCESSING] Error personalizado creado:", customError);
    
    return Promise.reject(customError);
  }
);

/* 
RESUMEN DE FUNCIONAMIENTO:

1. API: Para endpoints que requieren autenticación
   - Agrega automáticamente el token JWT en cada petición
   - Si recibe 401, limpia la sesión y redirige al login
   - Convierte errores del servidor en errores personalizados

2. PublicAPI: Para endpoints públicos (registro, login, etc.)
   - No agrega token de autenticación
   - Solo maneja errores y los convierte en formato personalizado

CASOS DE USO:
- API: Para obtener datos del usuario, actualizar perfil, etc.
- PublicAPI: Para login, registro, recuperar contraseña, etc.

📊 LOGS IMPLEMENTADOS:
- 🌐 CONFIG: Configuración inicial
- 🚀 REQUEST: Detalles de peticiones salientes
- ✅ SUCCESS: Respuestas exitosas con datos
- ❌ ERROR: Errores con información completa
- 🔑 TOKEN: Manejo de autenticación
- 🚪 AUTH: Procesos de logout
- 🧹 STORE: Limpieza de estado
- 🔧 PROCESSING: Transformación de errores

💡 CONSEJOS PARA DEBUGGING:
- Filtra logs por emoji para categorías específicas
- Los tokens se muestran truncados por seguridad
- Revisa 'fullError' para información completa del error
- Los URLs completos ayudan a verificar endpoints
- duration en respuestas exitosas muestra rendimiento
*/