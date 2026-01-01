# language: es

Característica: Suscripción Automática a Notificaciones Push
  Como usuario de Vecivendo con teléfono verificado
  Quiero que el sistema me invite a suscribirme a notificaciones push
  Para no perderme actualizaciones importantes sobre anuncios de mi interés y actividad de mi cuenta

  Antecedentes:
    Dado que el usuario tiene la PWA instalada
    Y el navegador soporta Push Notifications
    Y el Service Worker está registrado correctamente
    Y existe un usuario con teléfono verificado

  ## --------------------------------------------------------------------------
  ## Escenario 1: Verificación en Segundo Plano
  ## --------------------------------------------------------------------------

  @verificacion @happy-path
  Escenario: Verificar suscripción push en segundo plano al cargar la página
    Dado que el usuario tiene su teléfono verificado en localStorage (telefono_verificado=true)
    Y el usuario tiene un userId almacenado en localStorage
    Cuando el componente AutoPushSubscribe se monta en la página
    Entonces debe esperar 3 segundos después del render inicial
    Y debe consultar el endpoint "/api/push/check-subscription" con el userId y teléfono
    Y la verificación debe ejecutarse sin bloquear la interfaz de usuario
    Y no debe mostrarse ningún indicador de carga visible al usuario

  @verificacion
  Escenario: Usuario sin teléfono verificado no se verifica push
    Dado que el usuario NO tiene su teléfono verificado (telefono_verificado=false)
    Cuando el componente AutoPushSubscribe se monta en la página
    Entonces NO debe consultar el endpoint de verificación de suscripción
    Y NO debe mostrarse el modal de suscripción push
    Y el componente debe permanecer silencioso

  @verificacion
  Escenario: Usuario sin datos en localStorage no se verifica
    Dado que NO existe la clave "vecivendo_user_global" en localStorage
    Cuando el componente AutoPushSubscribe se monta en la página
    Entonces NO debe realizarse ninguna verificación
    Y el componente debe registrar en consola "Usuario sin teléfono verificado"

  ## --------------------------------------------------------------------------
  ## Escenario 2: Usuario Ya Suscrito
  ## --------------------------------------------------------------------------

  @ya-suscrito @happy-path
  Escenario: Usuario con push target registrado no recibe modal
    Dado que el usuario tiene teléfono verificado
    Y el usuario ya tiene un push target registrado en Appwrite
    Cuando el sistema verifica la suscripción en segundo plano
    Entonces la API debe responder con isSubscribed=true
    Y NO debe mostrarse el modal de suscripción
    Y debe registrarse en consola "Usuario ya tiene push target registrado"

  @ya-suscrito
  Escenario: Usuario suscrito localmente sin target registra automáticamente
    Dado que el usuario tiene teléfono verificado
    Y el usuario está suscrito a push localmente en el navegador
    Pero NO tiene un push target registrado en Appwrite
    Cuando el sistema verifica la suscripción en segundo plano
    Entonces debe intentar registrar el token existente como target
    Y debe llamar al endpoint "/api/push/register-target" con el token
    Y NO debe mostrarse el modal de suscripción
    Y debe registrarse "Target registrado exitosamente"

  ## --------------------------------------------------------------------------
  ## Escenario 3: Mostrar Modal de Suscripción
  ## --------------------------------------------------------------------------

  @modal @happy-path
  Escenario: Mostrar modal cuando usuario no está suscrito
    Dado que el usuario tiene teléfono verificado
    Y el usuario NO tiene push target registrado en Appwrite
    Y el usuario NO está suscrito localmente a push
    Y el usuario NO ha declinado la suscripción en las últimas 48 horas
    Cuando el sistema completa la verificación en segundo plano
    Entonces debe mostrarse el modal de suscripción push
    Y el modal debe tener:
      | Elemento                | Descripción                                              |
      | Título                  | "Activa las notificaciones"                              |
      | Subtítulo               | "Mantente al día con tu comunidad"                       |
      | Beneficio 1             | "Anuncios de tu interés"                                 |
      | Beneficio 2             | "Actividad de tu cuenta"                                 |
      | Beneficio 3             | "Novedades del residencial"                              |
      | Botón primario          | "Activar notificaciones" con ícono de campana            |
      | Botón secundario        | "Ahora no"                                               |
      | Nota al pie             | "Puedes cambiar esto en cualquier momento desde tu perfil" |
    Y el modal debe tener un diseño visualmente atractivo con gradiente primario

  @modal @visual
  Escenario: Modal tiene animaciones suaves
    Dado que debe mostrarse el modal de suscripción
    Cuando el modal se abre
    Entonces debe tener animación "zoom-in-95" al aparecer
    Y debe tener "backdrop-blur-sm" en el fondo oscuro
    Y debe tener un ícono de campana con animación "ping"

  ## --------------------------------------------------------------------------
  ## Escenario 4: Usuario Acepta Suscripción
  ## --------------------------------------------------------------------------

  @aceptar @happy-path
  Escenario: Usuario acepta suscribirse a notificaciones
    Dado que se muestra el modal de suscripción push
    Cuando el usuario hace clic en "Activar notificaciones"
    Entonces debe mostrarse el indicador de carga "Activando..."
    Y el botón debe deshabilitarse durante el proceso
    Y el navegador debe solicitar permiso de notificaciones
    Y si el usuario concede el permiso:
      | Acción                    | Descripción                                    |
      | Suscribirse a push        | Se crea la suscripción en PushManager          |
      | Obtener token             | Se extrae el token FCM del endpoint            |
      | Registrar target          | Se llama a /api/push/register-target           |
      | Limpiar decline           | Se elimina vecivendo_push_decline_timestamp    |
      | Cerrar modal              | El modal se cierra automáticamente             |
      | Log de éxito              | "¡Suscripción completada exitosamente!"        |

  @aceptar
  Escenario: Registro del push target con ID correcto
    Dado que el usuario acepta las notificaciones
    Y el teléfono del usuario es "+52 55 1234 5678"
    Cuando se registra el push target en Appwrite
    Entonces el providerId debe ser "5255123456PUSH"
    Y el identifier debe ser el token FCM completo
    Y el providerType debe ser "push"
    Y el target debe estar asociado al userId del usuario

  @aceptar @error
  Escenario: Error al solicitar permiso de notificaciones
    Dado que se muestra el modal de suscripción push
    Cuando el usuario hace clic en "Activar notificaciones"
    Y el navegador solicita permiso
    Pero el usuario deniega el permiso
    Entonces debe mostrarse el mensaje de error:
      "No se pudo activar las notificaciones. Verifica los permisos de tu navegador."
    Y el modal debe permanecer abierto
    Y el usuario puede intentar de nuevo o cerrar el modal

  @aceptar @error
  Escenario: Error al registrar target en el servidor
    Dado que se muestra el modal de suscripción push
    Y el usuario acepta las notificaciones
    Y el navegador concede el permiso
    Pero hay un error al llamar a /api/push/register-target
    Entonces debe mostrarse el mensaje de error del servidor
    Y el modal debe permanecer abierto
    Y se debe registrar el error en consola

  ## --------------------------------------------------------------------------
  ## Escenario 5: Usuario Declina Suscripción
  ## --------------------------------------------------------------------------

  @declinar @happy-path
  Escenario: Usuario declina suscribirse
    Dado que se muestra el modal de suscripción push
    Cuando el usuario hace clic en "Ahora no"
    Entonces debe guardarse el timestamp actual en localStorage
    Con la clave "vecivendo_push_decline_timestamp"
    Y el modal debe cerrarse
    Y debe registrarse en consola "Usuario declinó, no preguntar por 48h"

  @declinar
  Escenario: Usuario cierra modal con el botón X
    Dado que se muestra el modal de suscripción push
    Cuando el usuario hace clic en el botón X de cerrar
    Entonces debe tratarse igual que hacer clic en "Ahora no"
    Y debe guardarse el timestamp de decline
    Y el modal debe cerrarse

  @declinar
  Escenario: Usuario cierra modal haciendo clic en el backdrop
    Dado que se muestra el modal de suscripción push
    Cuando el usuario hace clic fuera del modal (en el backdrop oscuro)
    Entonces debe tratarse igual que hacer clic en "Ahora no"
    Y debe guardarse el timestamp de decline

  ## --------------------------------------------------------------------------
  ## Escenario 6: Cooldown de 48 Horas
  ## --------------------------------------------------------------------------

  @cooldown @happy-path
  Escenario: No mostrar modal si usuario declinó hace menos de 48 horas
    Dado que el usuario tiene teléfono verificado
    Y el usuario NO tiene push target registrado
    Pero el usuario declinó la suscripción hace 24 horas
    Cuando el componente AutoPushSubscribe verifica la suscripción
    Entonces NO debe mostrarse el modal de suscripción
    Y debe registrarse en consola "Usuario declinó recientemente, esperando 48h"

  @cooldown
  Escenario: Mostrar modal después de 48 horas de decline
    Dado que el usuario tiene teléfono verificado
    Y el usuario NO tiene push target registrado
    Y el usuario declinó la suscripción hace exactamente 49 horas
    Cuando el componente AutoPushSubscribe verifica la suscripción
    Entonces DEBE mostrarse el modal de suscripción
    Y el usuario tiene otra oportunidad de suscribirse

  @cooldown
  Escenario: Limpiar timestamp de decline al aceptar
    Dado que el usuario ha declinado anteriormente
    Y existe "vecivendo_push_decline_timestamp" en localStorage
    Cuando el usuario finalmente acepta las notificaciones
    Entonces debe eliminarse la clave "vecivendo_push_decline_timestamp"
    Y el usuario está completamente suscrito

  ## --------------------------------------------------------------------------
  ## Escenario 7: API Check Subscription
  ## --------------------------------------------------------------------------

  @api
  Escenario: API retorna suscripción existente
    Dado que existe un usuario con userId "user123"
    Y el usuario tiene un push target registrado en Appwrite
    Cuando se llama a GET /api/push/check-subscription?userId=user123
    Entonces la respuesta debe ser:
      """json
      {
        "isSubscribed": true,
        "targetId": "target_abc123",
        "providerId": "5255123456PUSH",
        "identifier": "fcm_token_xxx..."
      }
      """
    Y el código de estado debe ser 200

  @api
  Escenario: API retorna no suscrito
    Dado que existe un usuario con userId "user456"
    Y el usuario NO tiene push target registrado
    Cuando se llama a GET /api/push/check-subscription?userId=user456&phone=5512345678
    Entonces la respuesta debe ser:
      """json
      {
        "isSubscribed": false,
        "expectedProviderId": "5512345678PUSH"
      }
      """
    Y el código de estado debe ser 200

  @api @error
  Escenario: API rechaza request sin parámetros
    Cuando se llama a GET /api/push/check-subscription sin parámetros
    Entonces la respuesta debe ser:
      """json
      {
        "error": "Se requiere userId o phone"
      }
      """
    Y el código de estado debe ser 400

  ## --------------------------------------------------------------------------
  ## Escenario 8: API Register Target
  ## --------------------------------------------------------------------------

  @api
  Escenario: API registra nuevo push target
    Dado que el usuario con userId "user123" no tiene push target
    Cuando se llama a POST /api/push/register-target con:
      """json
      {
        "userId": "user123",
        "phone": "+52 55 1234 5678",
        "token": "fcm_token_abcdefghijk..."
      }
      """
    Entonces debe crearse un nuevo target en Appwrite con:
      | Campo        | Valor                    |
      | providerType | "push"                   |
      | providerId   | "5255123456PUSH"         |
      | identifier   | "fcm_token_abcdefghijk..." |
    Y la respuesta debe ser:
      """json
      {
        "success": true,
        "action": "created",
        "targetId": "generated_target_id",
        "providerId": "5255123456PUSH"
      }
      """
    Y el código de estado debe ser 200

  @api
  Escenario: API actualiza push target existente
    Dado que el usuario con userId "user123" ya tiene push target
    Y el providerId existente es "5255123456PUSH"
    Cuando se llama a POST /api/push/register-target con un nuevo token
    Entonces debe actualizarse el identifier del target existente
    Y la respuesta debe indicar action: "updated"

  @api @error
  Escenario: API rechaza registro sin userId
    Cuando se llama a POST /api/push/register-target sin userId
    Entonces la respuesta debe ser:
      """json
      {
        "error": "Se requiere userId"
      }
      """
    Y el código de estado debe ser 400

  @api
  Escenario: API elimina push target
    Dado que el usuario con userId "user123" tiene push target
    Cuando se llama a DELETE /api/push/register-target con:
      """json
      {
        "userId": "user123",
        "phone": "+52 55 1234 5678"
      }
      """
    Entonces debe eliminarse el target de Appwrite
    Y la respuesta debe indicar action: "deleted"

  ## --------------------------------------------------------------------------
  ## Escenario 9: Casos Edge
  ## --------------------------------------------------------------------------

  @edge
  Escenario: Navegador no soporta push
    Dado que el navegador del usuario NO soporta Push Notifications
    Cuando el componente AutoPushSubscribe se monta
    Entonces NO debe realizarse ninguna verificación
    Y NO debe mostrarse el modal
    Y no debe haber errores en consola

  @edge
  Escenario: Permiso de notificaciones previamente denegado en navegador
    Dado que el usuario previamente denegó permisos de notificación en el navegador
    Y el permission es "denied"
    Cuando el componente AutoPushSubscribe se monta
    Entonces NO debe mostrarse el modal de suscripción
    Y el componente debe terminar silenciosamente

  @edge
  Escenario: Error de red al verificar suscripción
    Dado que el usuario tiene teléfono verificado
    Cuando el sistema intenta verificar la suscripción
    Pero hay un error de red
    Entonces debe capturarse el error silenciosamente
    Y NO debe mostrarse el modal
    Y debe registrarse el error en consola

  @edge
  Escenario: localStorage no disponible
    Dado que localStorage no está disponible (modo incógnito restrictivo)
    Cuando el componente AutoPushSubscribe intenta leer datos
    Entonces debe capturarse el error graciosamente
    Y el componente debe retornar null sin errores
    Y no debe bloquearse la aplicación

  ## --------------------------------------------------------------------------
  ## Criterios de Aceptación Generales
  ## --------------------------------------------------------------------------

  # 1. ✅ La verificación se realiza en segundo plano sin bloquear la UI
  # 2. ✅ El modal solo aparece si el usuario tiene teléfono verificado
  # 3. ✅ El modal solo aparece si el usuario NO tiene push target registrado
  # 4. ✅ El modal solo aparece si no han pasado menos de 48h desde el último decline
  # 5. ✅ El providerId del target sigue el formato: TELÉFONO_SIN_CARACTERES + "PUSH"
  # 6. ✅ Si el usuario declina, no se le pregunta por 48 horas
  # 7. ✅ Si el usuario acepta, se registra el token como target en Appwrite
  # 8. ✅ Los errores se manejan graciosamente sin bloquear la aplicación
  # 9. ✅ El modal tiene un diseño visualmente atractivo y profesional
  # 10. ✅ Se respeta si el navegador no soporta push o si el permiso fue denegado
