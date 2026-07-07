# FASE-06-ARQUITECTURA-APP-Y-BACKEND.md

# CITY QUEST EXPLORER

## ARQUITECTURA TECNOLÓGICA

Versión: 1.0

Estado: Diseño Técnico Maestro

---

# OBJETIVO

Diseñar la arquitectura completa de City Quest Explorer para soportar:

- Múltiples ciudades
- Múltiples historias
- Múltiples temporadas
- Experiencias simultáneas
- GPS
- QR
- NFC opcional
- IA Conversacional
- Actores
- Rankings
- Certificados
- Contenido multimedia
- Eventos especiales

---

# VISIÓN GENERAL

City Quest Explorer debe funcionar como:

## Netflix + Escape Room + Pokémon GO + Juego de Misterio

Pero centrado en experiencias urbanas cinematográficas.

---

# ARQUITECTURA GENERAL

```text
APP MOVIL
     │
     ▼
API PRINCIPAL
     │
 ┌───┼──────────────┐
 │   │              │
 ▼   ▼              ▼

Historias
Jugadores
Operaciones

 │
 ▼

Motor Narrativo

 │
 ▼

GPS + QR + Multimedia + IA
```

---

# TIPOS DE USUARIO

## 1. JUGADOR

Funciones:

- Registrarse
- Comprar experiencias
- Jugar
- Ver ranking
- Ver certificados
- Consultar historial

---

## 2. OPERADOR

Funciones:

- Crear sesiones
- Entregar cajas
- Supervisar partidas
- Monitorear equipos

---

## 3. ACTOR

Funciones:

- Ver horarios
- Ver personajes
- Confirmar asistencia
- Consultar guiones

---

## 4. ADMINISTRADOR

Control total.

---

# MÓDULOS PRINCIPALES

## MÓDULO 1

AUTENTICACIÓN

---

Registro:

- Email
- Google
- Apple
- Facebook

---

Campos:

Nombre

Teléfono

País

Idioma

Ciudad

---

# PERFIL DEL JUGADOR

Contendrá:

ID

Alias

Nivel

Experiencias completadas

Puntos

Certificados

Logros

Ranking

---

# SISTEMA DE RANGOS

## Nivel 1

Investigador

---

## Nivel 2

Detective

---

## Nivel 3

Criptógrafo

---

## Nivel 4

Archivista

---

## Nivel 5

Guardián

---

## Nivel 6

Custodio

---

# MÓDULO HISTORIAS

Cada historia tendrá:

```json
{
  "id": "historia_001",
  "nombre": "El Manuscrito Prohibido",
  "ciudad": "Cartagena",
  "temporada": "2026-01",
  "estado": "Activa"
}
```

---

# SISTEMA DE TEMPORADAS

Ejemplo:

Temporada 1

El Manuscrito Prohibido

---

Temporada 2

Los Custodios del Caribe

---

Temporada 3

La Sociedad de las Sombras

---

# ESTRUCTURA DE ESTACIONES

Cada estación tendrá:

```json
{
  "id":"EST-01",
  "nombre":"La Desaparición",
  "gps":true,
  "qr":true,
  "video":"video01",
  "audio":"audio01",
  "actor":false
}
```

---

# MOTOR GPS

Función:

Validar ubicación.

---

Parámetros:

Radio permitido:

20 a 50 metros

---

Estados:

- Fuera de zona
- Cerca
- Dentro

---

# EVENTOS GPS

Ejemplo:

```text
Jugador entra a zona

↓

ARIADNA envía audio

↓

Se desbloquea pista

↓

Se habilita respuesta
```

---

# MOTOR QR

Cada QR será único.

---

Tipos:

Narrativo

Pista

Validación

Actor

Emergencia

---

# MOTOR NFC

OPCIONAL

Nunca obligatorio.

---

Funciones:

Contenido oculto

Evidencia especial

Coleccionables digitales

---

# MOTOR DE RESPUESTAS

Tipos:

Texto

Número

Selección múltiple

Código

QR

---

Ejemplo:

```json
{
  "respuesta":"MARTIR",
  "correcta":true
}
```

---

# SISTEMA DE AYUDAS

Ayuda 1

Gratis

---

Ayuda 2

Gratis

---

Ayuda 3

+5 minutos

---

Ayuda 4

+10 minutos

---

# MOTOR DE PUNTUACIÓN

Variables:

Tiempo

Errores

Ayudas

Rutas

Logros

---

Fórmula:

```text
Puntaje Final

=

Tiempo

-

Penalizaciones

+

Logros
```

---

# SISTEMA DE RANKING

## Ranking Diario

---

## Ranking Mensual

---

## Ranking Histórico

---

## Ranking por Ciudad

---

## Ranking por Historia

---

# MÓDULO DE CERTIFICADOS

Generación automática.

---

Contenido:

Nombre

Alias

Historia

Ciudad

Fecha

Tiempo

Rango

Código QR

---

Formato:

PDF

---

# SISTEMA DE LOGROS

Ejemplos:

Primer Caso

---

Sin Ayudas

---

Velocidad Máxima

---

Descubridor

---

Criptógrafo Maestro

---

# PANEL OPERADOR

Visualiza:

Sesiones activas

Equipos

Ubicaciones

Incidencias

Tiempo restante

---

# PANEL DE ACTORES

Visualiza:

Guion

Ubicación

Horario

Equipo asignado

---

# PANEL ADMINISTRADOR

Gestiona:

Usuarios

Historias

Ciudades

Pagos

Contenido

Analíticas

Actores

Operadores

---

# SISTEMA MULTICIUDAD

Ciudades iniciales:

- Cartagena
- Santa Marta
- Barranquilla
- Sincelejo
- Montería

---

Cada ciudad tendrá:

Historias propias

Personajes propios

Pistas propias

Rankings propios

---

# MOTOR MULTIHISTORIA

Un jugador puede completar:

```text
Cartagena Historia 1

↓

Barranquilla Historia 3

↓

Santa Marta Historia 2
```

Sin dependencia narrativa.

---

# IA CONVERSACIONAL

ARIADNA

---

Funciones:

Responder dudas

Dar pistas

Narrar

Ayudar

Mantener inmersión

---

Modos:

Narrativo

Ayuda

Emergencia

---

# SISTEMA DE REEL AUTOMÁTICO

Al finalizar:

App recopila:

Fotos

Videos

Momentos

Logros

---

Genera:

Video resumen

Formato vertical

15-30 segundos

---

Entrega:

WhatsApp

Email

App

---

# SISTEMA DE FOTOGRAFÍAS

Puntos fotográficos sugeridos.

---

No obligatorio.

---

Asociados a logros.

---

# ANALÍTICAS

Métricas:

Tiempo promedio

Pistas más difíciles

Uso de ayudas

Abandono

Finalización

Satisfacción

---

# MÉTRICAS DE NEGOCIO

Ventas

Ocupación

Recompra

Retención

Referidos

---

# SISTEMA DE SEGURIDAD

Validación GPS

Control de QR

Tokens temporales

Sesiones únicas

Antifraude

---

# SISTEMA DE PAGOS

Compatibles:

Tarjeta

PSE

Nequi

Daviplata

PayPal

Stripe

Mercado Pago

---

# ESCALABILIDAD FUTURA

Capacidad para:

100+

Historias

---

50+

Ciudades

---

Miles de jugadores simultáneos

---

# VISIÓN A 5 AÑOS

City Quest Explorer se convierte en una plataforma de aventuras urbanas cinematográficas donde cada ciudad posee secretos únicos y cada jugador construye su propia historia como investigador.

---

# FILOSOFÍA OFICIAL

> Cada ciudad esconde secretos.
>
> Y tú puedes ayudarnos a resolverlos.

---

# FIN DEL DOCUMENTO
