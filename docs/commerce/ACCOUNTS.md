# Cuentas y carreras en la nube

La cuenta es **gratis y opcional**: sin cuenta se juega todo. Sirve para proteger las compras, copiar las carreras en la
nube y seguir en otro dispositivo.

## Crear la cuenta y entrar

- **Métodos:** Apple, Google o email con un código de 6 cifras. No hay contraseñas propias.
- **Web real:** Supabase Auth (`signInWithOAuth` para Apple y Google; `signInWithOtp` + `verifyOtp` para el código).
  La plantilla del correo debe incluir `{{ .Token }}`; `config.toml` fija `otp_length = 6` y `otp_expiry = 600`.
- **Prototipo:** el backend simulado genera el código y lo enseña en una «bandeja de entrada simulada». No se envía
  nada. Reenviar: como mucho cada 30 s; 5 intentos y caduca a los 10 min.
- **Otro dispositivo:** «Ya tengo cuenta» → mismo flujo → si hay carreras en la nube, se ofrece traerlas.

## Perfil (`commerce/core/accounts.js`)

| Campo | Reglas |
|---|---|
| Nombre visible | 1–24 caracteres; se quitan `<`, `>` y caracteres de control |
| País | De una lista cerrada (`COUNTRIES`); `ZZ` = otro |
| Edad | `u13`, `13_17` o `18p`. **Se fija una sola vez** (`age_locked`): nadie se «hace mayor» para saltarse límites |
| Términos | `acceptTerms` debe ser `TERMS_VERSION`; se guarda versión y fecha |
| Novedades por email | Opcional, desmarcada. A un menor nunca se le apunta (también por constraint en la base de datos) |
| Permiso parental | Solo `u13`: el menor da el email del tutor → `pending`. Lo aprueba el **servidor** (`setParentalStatus`), nunca la app |

- `canPurchase` exige edad, términos vigentes y, si es `u13`, permiso aprobado.
- El checkout de Stripe vuelve a comprobarlo en el servidor (`parental_consent_required`).
- Menores: el juego no enseña ofertas emergentes.

## Carreras en la nube

- Ranuras locales: 2 gratis + 3 con `slots.extra_3` (pack «+3 carreras» o Founder).
- La ranura 0 usa la clave antigua `del_barrio_al_negocio_p2`: las partidas de antes aparecen como «Carrera 1».
- **Subir** (`PUT /game-saves`): por ranura gana la copia más reciente (`guardadoEn`). Un móvil viejo no pisa lo jugado
  en otro. Borrar en la nube es explícito (`borradas`).
- **Traer:** solo rellena ranuras vacías o más antiguas, salvo «Usar igualmente las de la nube». Las ranuras de pago
  sin el pack se quedan en la nube.
- **Límites:** 400 KB por carrera, 1,5 MB en total, 10 ranuras en el servidor. Se rechaza lo que no es una partida.
- Solo datos de juego: **nunca** concede compras. Los entitlements siguen viniendo del servidor.

## Datos y borrado

- `GET /account-export`: perfil, compras, entitlements y carreras (RGPD, arts. 15 y 20).
- Eliminar la cuenta: hay que escribir ELIMINAR. Se borran el perfil, las carreras de la nube y la cuenta de Auth. La
  contabilidad se conserva anonimizada. Las carreras del dispositivo se quedan.

## Backend

- Migración `backend/supabase/migrations/20261009000000_accounts.sql`: columnas del perfil, constraint de publicidad para
  menores, el cliente ya no puede editar el perfil directamente (pasa por la función), lectura propia de `game_saves`.
- Edge Functions: `profile` (GET/PATCH), `game-saves` (GET/PUT), `account-export` (GET).

## Pendiente (técnico)

- Configurar los proveedores Apple y Google y la plantilla del correo en Supabase.
- Enviar el email al tutor y la Edge Function que recibe su respuesta (firmada y con caducidad).
- Revisión legal de los textos (términos, privacidad, permiso parental, edad mínima por país).
