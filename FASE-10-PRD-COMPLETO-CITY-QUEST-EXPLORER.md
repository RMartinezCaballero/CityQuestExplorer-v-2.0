# FASE-10-PRD-COMPLETO-CITY-QUEST-EXPLORER.md

# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## CITY QUEST EXPLORER

Versión: 1.0

Estado: Documento Maestro de Desarrollo

---

# 1. VISIÓN DEL PRODUCTO

## Descripción

City Quest Explorer es una plataforma de experiencias urbanas inmersivas que transforma ciudades reales en aventuras cinematográficas interactivas.

Los jugadores recorren espacios públicos resolviendo misterios mediante:

* GPS
* QR
* IA Conversacional (ARIADNA)
* Videos
* Audios
* Actores
* Gamificación
* Narrativa cinematográfica

---

## Filosofía

> Cada ciudad esconde secretos. Y tú puedes ayudarnos a resolverlos.

---

## Objetivo Estratégico

Crear la plataforma líder de aventuras urbanas inmersivas de Latinoamérica.

Ciudades iniciales:

* Cartagena
* Santa Marta
* Barranquilla
* Sincelejo
* Montería

---

# 2. PLATAFORMAS

## MVP

### Aplicación móvil

* Android
* iOS

Tecnología recomendada:

Flutter

---

### Sitio Web

Funciones:

* Landing Page
* Compra de experiencias
* Reservas
* Gestión de códigos de acceso

---

### Backend

Opciones:

* Supabase
* Firebase

Recomendación:

Supabase

---

# 3. MODELO DE ACCESO

## Flujo

### Paso 1

Compra realizada.

### Paso 2

Generación automática de:

* Código único
* QR de acceso
* Reserva

### Paso 3

Correo de confirmación.

### Paso 4

Descarga App.

### Paso 5

Ingreso mediante código de acceso.

No requiere registro tradicional obligatorio.

---

# 4. MULTIIDIOMA

Idiomas iniciales:

* Español
* Inglés

Arquitectura preparada para:

* Francés
* Alemán
* Italiano
* Portugués

---

# 5. ROLES DEL SISTEMA

## Administrador

Permisos totales.

Puede:

* Crear ciudades
* Crear historias
* Configurar pagos
* Gestionar usuarios
* Gestionar temporadas
* Ver analíticas

---

## Editor Narrativo

Puede:

* Crear historias
* Crear estaciones
* Crear pistas
* Crear QR
* Crear audios
* Crear videos

No puede:

* Gestionar pagos

---

## Operador

Puede:

* Crear sesiones
* Activar partidas
* Monitorear equipos
* Cerrar experiencias

No puede modificar historias.

---

## Jugador

Puede:

* Acceder a experiencias
* Consultar rankings
* Descargar certificados
* Consultar historial

---

# 6. SISTEMA MULTICIUDAD

Cada ciudad tendrá:

* Historias independientes
* Rankings independientes
* Operadores independientes
* Temporadas independientes

---

# 7. MOTOR NARRATIVO

Cada historia se compone de:

## Introducción

Video inicial.

---

## Investigación

Pistas encadenadas.

---

## Punto Medio

Giro argumental.

---

## Revelación

Descubrimiento principal.

---

## Final

Resolución.

---

## Postcréditos

Contenido opcional.

---

# 8. SISTEMA GPS

Cada estación posee:

* Latitud
* Longitud
* Radio de activación

---

## Validación

El jugador debe encontrarse dentro del perímetro definido.

---

## Funciones

* Activar contenido
* Mostrar pistas
* Desbloquear eventos

---

# 9. SISTEMA QR

Cada QR incluye:

* Historia
* Estación
* Token de validación

---

Funciones:

* Abrir video
* Abrir audio
* Validar progreso
* Mostrar evidencia

---

# 10. SISTEMA NFC

Opcional.

Siempre debe existir alternativa QR.

---

Funciones:

* Llave digital
* Contenido oculto
* Activaciones especiales

---

# 11. SISTEMA DE RESPUESTAS

Tipos:

* Texto
* Numéricas
* QR
* GPS

---

Regla principal:

GPS + Respuesta Correcta

---

# 12. SISTEMA DE AYUDAS

## Ayudas Iniciales

Sin penalización.

---

## Ayudas Avanzadas

Penalización:

* Tiempo
* Puntos

---

Configurables por historia.

---

# 13. ARIADNA

## Funciones

### Narradora

Presenta contenido.

---

### Asistente

Ayuda al jugador.

---

### IA Conversacional

Responde preguntas.

---

### Sistema de Pistas

Entrega ayudas.

---

### Sistema GPS

Dispara eventos contextuales.

---

# 14. CONTENIDO MULTIMEDIA

## Videos

Formato:

MP4

---

Tipos:

* Intro
* Descubrimiento
* Punto Medio
* Revelación
* Final

---

## Audios

Formato:

MP3

---

Tipos:

* ARIADNA
* Isabella
* Evidencias
* Villano

---

# 15. SISTEMA DE ACTORES

Máximo:

3 actores simultáneos.

---

Funciones:

### Actor 1

Misterio.

---

### Actor 2

Conflicto.

---

### Actor 3

Revelación.

---

# 16. LIBRETA DEL INVESTIGADOR

Elemento físico obligatorio.

---

Características:

* Una página por estación.
* Espacios para notas.
* Registro de códigos.
* Registro de evidencias.

---

# 17. CAJA DE INVESTIGACIÓN

Modelo reutilizable.

---

Contenido base:

* Carta inicial
* Mapa
* Libreta
* Lupa
* Tarjeta NFC
* Sobre sellado
* Coleccionable

---

# 18. SISTEMA DE LOGROS

Rangos:

* Investigador
* Detective
* Criptógrafo
* Archivista
* Custodio

---

Otorgados según:

* Tiempo
* Desempeño
* Historias completadas

---

# 19. RANKINGS

## Historia

---

## Ciudad

---

## Global

---

## Equipos

---

## Individual

---

Variables:

* Tiempo
* Errores
* Ayudas

---

# 20. CERTIFICADOS

## Automáticos

Generados por sistema.

---

## Personalizados

Por historia.

---

Incluyen:

* Nombre
* Ciudad
* Historia
* Tiempo
* Ranking

---

# 21. REEL AUTOMÁTICO

Requiere autorización del jugador.

---

Contenido:

* Fotos
* Videos
* Momentos destacados

---

Entrega:

Posterior a la experiencia.

---

# 22. ANALÍTICAS

## Jugador

* Tiempo total
* Tiempo por estación
* Errores
* Ayudas

---

## Historia

* Finalización
* Abandono

---

## Negocio

* Conversión
* Recompra
* Retención

---

# 23. PANEL ADMINISTRATIVO

Módulos:

* Usuarios
* Historias
* Ciudades
* Multimedia
* Pagos
* Estadísticas
* Operadores

---

# 24. PANEL OPERATIVO

Funciones:

* Crear sesión
* Iniciar sesión
* Monitorear jugadores
* Gestionar incidencias
* Finalizar partida

---

# 25. PASARELAS DE PAGO

Obligatorias:

* PSE
* Nequi
* Daviplata
* Tarjetas Crédito
* Tarjetas Débito
* PayPal

---

Integradores recomendados:

* Wompi
* Mercado Pago
* PayU

---

# 26. MODO OFFLINE

Si se pierde conexión:

La experiencia continúa parcialmente.

---

Disponible:

* Último contenido descargado
* Libreta digital
* Respuestas pendientes

---

# 27. SEGURIDAD

* JWT
* HTTPS
* Roles
* Auditoría
* Logs
* Backups automáticos

---

# 28. ROADMAP

## MVP

Cartagena

1 Historia

---

## V1

Cartagena

3 Historias

---

## V2

5 Ciudades

---

## V3

Sistema Franquicias

---

# 29. KPIs

Operativos:

* Tiempo promedio
* Tasa de finalización
* Uso de ayudas

---

Comerciales:

* Conversión
* CAC
* LTV
* Recompra

---

Comunidad:

* Referidos
* Contenido generado
* Participación

---

# 30. DEFINICIÓN DE ÉXITO

Al terminar una experiencia, el jugador debe sentir:

* Que vivió una película.
* Que descubrió un secreto oculto.
* Que resolvió un misterio real.
* Que quiere jugar otra historia.

---

# 31. ESCALABILIDAD

Diseñado para operar inicialmente en:

* Cartagena
* Santa Marta
* Barranquilla
* Sincelejo
* Montería

---

Arquitectura preparada para:

* 20 ciudades
* 100+ historias
* 100.000+ jugadores

---

# RESULTADO FINAL

Este documento constituye la especificación funcional completa para:

* Desarrollo móvil
* Backend
* UX/UI
* Narrativa
* Operación
* Producción audiovisual
* Escalabilidad comercial

---

# FIN DEL DOCUMENTO
