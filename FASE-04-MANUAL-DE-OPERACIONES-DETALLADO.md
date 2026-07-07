# FASE-04-MANUAL-DE-OPERACIONES-DETALLADO.md

## RESUMEN EJECUTIVO

La Fase 04 define todos los procedimientos operativos para ejecutar una sesión de **City Quest Explorer** con consistencia y calidad. Incluye los checklists pre-evento (T–60, T–30, T–15, T–0), briefing inicial (5 min), protocolos de ayuda, retrasos, clima, médico y seguridad, así como guiones resumidos para actores. Se detalla el cronograma minuto a minuto, inventario de materiales y producción semanal de cajas. Además, se establecen KPIs operativos/comerciales, un modelo mínimo de franquicia, plan de formación de actores (8 h) y control de calidad. La plataforma se apoyará en servicios gratuitos (p.ej. Supabase Free, Cloudflare R2 Free, Firebase Spark, Google Maps API gratis), y los pagos se procesarán vía Wompi (comisión de 2,65%) o métodos locales sin tarifa mensual, minimizando así los costos operativos.

## OBJETIVO

Establecer los procesos, roles y recursos necesarios para que cada experiencia se ejecute de forma eficiente, segura y consistente. Garantizar una operación fluida desde la preparación previa hasta el cierre, cumpliendo con los estándares de calidad de City Quest Explorer.

## ALCANCE

Este manual abarca la **preparación** previa a cada sesión (checklists T–60 a T–0), la **ejecución** de la sesión (bienvenida, briefing, recorrido de juego y cierre) y el **post-evento** (certificados y feedback). Incluye roles/responsabilidades, protocolos, guiones simplificados, cronograma detallado, logística de materiales, producción semanal, KPIs, modelo de franquicia, formación de personal y control de calidad.

## ROLES Y RESPONSABILIDADES

| Rol                    | Responsabilidades clave                                                            |
|------------------------|------------------------------------------------------------------------------------|
| **Director de Experiencia** | - Supervisión general de la sesión.<br>- Control de calidad y KPIs.<br>- Coordinación del equipo y resolución de incidencias.<br>- Análisis de métricas operativas. |
| **Operador de Sesión**      | - Registro y validación de reservas.<br>- Entrega de cajas de investigación.<br>- Activación de la app y sincronización.<br>- Monitoreo remoto del progreso (GPS, QR).<br>- Comunicación vía WhatsApp/Telegram con jugadores. |
| **Actores (3 máximo)**      | - Interpretación de personajes asignados.<br>- Realización de escenas en ubicaciones definidas.<br>- Entrega de pistas verbales o físicas.<br>- Mantener el personaje sin romper la cuarta pared.<br>- Seguir guiones/sucesos definidos. |
| **Soporte Digital**         | - Soporte técnico (app, servidor, GPS).<br>- Gestión de bases de datos (Supabase Free) y multimedia (Cloudflare R2 Free).<br>- Configuración de mapas (Google Maps API gratis).<br>- Envío de notificaciones (FCM gratuito) y gestión de información en tiempo real.<br>- Asistencia a operadores vía chat. |

```mermaid
flowchart LR
    A[Llegada de jugadores] --> B[Registro y entrega de kits]
    B --> C[Briefing inicial (5 min)]
    C --> D[Juego: estaciones 1–12 con GPS/QR]
    D --> E[Encuentros con Actores/ARIADNA]
    E --> F[Estación final y revelación]
    F --> G[Entrega de certificado y foto grupal]
    G --> H[Fin de sesión / Feedback]
```

## CHECKLIST OPERATIVO PRE-EVENTO

### T–60: Verificación de Infraestructura y Personal
* [ ] Confirmar asistencia de los 3 actores principales (Mensajero, Falsificador, Guardián).
* [ ] Verificar que el Operador de Sesión cuente con conexión estable de datos.
* [ ] Comprobar el estado del servidor (Supabase, R2 y API de mapas).
* [ ] Imprimir la lista de reservas aprobadas y códigos únicos asignados para la jornada.

### T–30: Inspección Física y Logística
* [ ] Validar que todas las cajas de investigación del día contengan la libreta, el sobre sellado, la lupa, el mapa y el coleccionable.
* [ ] Comprobar legibilidad de los códigos QR impresos y tags NFC (si aplica).
* [ ] Actores se trasladan a sus estaciones base (Camellón de los Mártires, Castillo San Felipe, Murallas).
* [ ] Verificar las condiciones climáticas locales y la seguridad de la zona peatonal.

### T–15: Conexión de Campo
* [ ] Realizar una prueba de telemetría GPS desde la app con un dispositivo de prueba.
* [ ] Verificar que el canal de comunicación rápido de emergencias (WhatsApp/Telegram) esté configurado con el grupo de actores y operador.
* [ ] Disponer la mesa o punto de encuentro físico para la entrega inicial.

### T–0: Inicio de Sesión
* [ ] Bienvenida oficial al primer equipo o jugador individual.
* [ ] Escaneo de código de compra para activar la app del equipo.
* [ ] Entrega del kit físico y cronómetro de sesión iniciado en servidor.

---

## BRIEFING INICIAL (5 MINUTOS)

Guion para el Operador de Sesión:
1. **Saludo y Bienvenida (1 min):** *"Bienvenidos, agentes. Hoy no están aquí para un paseo turístico por Cartagena. Están a punto de vivir una investigación de alto riesgo. Una de nuestras mejores arqueólogas, Isabella Hidalgo Morales, ha desaparecido. Sus últimos rastros apuntan a un misterio ancestral protegido por siglos: El Manuscrito Prohibido."*
2. **Explicación de las Reglas (2 min):** 
   - *"Esta caja es su activo más valioso. Solo la abrirán cuando su asistente inmersivo, ARIADNA, lo autorice por la app."*
   - *"La ciudad es el tablero: utilicen el mapa físico y sigan las indicaciones GPS de la app móvil."*
   - *"Para progresar deberán descifrar pistas en el entorno real, encontrar códigos ocultos e interactuar con contactos en el campo."*
   - *"No ingresen a zonas restringidas ni pongan en riesgo su seguridad. Respeten las murallas y bienes públicos."*
3. **El Lanzamiento de Emergencia (1 min):** *"Al abrir la aplicación por primera vez, verán un video enviado de urgencia por Isabella antes de desaparecer. Presten mucha atención a cada palabra. Tienen un límite de 120 minutos. El reloj ya está corriendo. ¡Buena suerte!"*

---

## PROTOCOLOS DE INCIDENCIAS

### 1. Sistema de Ayudas e Interrupción Técnica
* **Nivel 1 & 2 (Gratuito):** Pistas de texto simples disponibles en la interfaz de ARIADNA para desatascar al equipo.
* **Nivel 3 (+5 minutos):** Solución parcial o pista explícita. Se añade penalización de 5 minutos al tiempo final del ranking.
* **Nivel 4 (+10 minutos):** Autocompletar estación si hay una falla de validación insuperable o problemas de geolocalización.

### 2. Retrasos de Jugadores
* Si un equipo llega hasta 15 minutos tarde, se inicia su sesión con normalidad.
* Si el retraso supera los 30 minutos, se les une a un bloque posterior o se reprograma la reserva física para optimizar el rol de los actores.

### 3. Protocolo de Clima Lluvioso o Clima Adverso
* **Lluvia Ligera:** La sesión continúa. Se recomienda el uso de impermeables.
* **Lluvia Fuerte / Tormenta:** Suspensión temporal inmediata de la telemetría. Los actores se refugian en puntos seguros de la ciudad. El cronómetro se detiene en la app y se reanuda al amainar o se reprograma sin costo.

### 4. Emergencias Médicas o de Seguridad
* Cualquier jugador que sufra un percance físico puede pulsar el botón de **"SOS Emergencia"** en la app.
* El operador recibe la alerta GPS exacta y llama inmediatamente al cuadrante de policía local o servicio de ambulancias de Cartagena. La sesión se da por terminada por motivos de fuerza mayor.

---

## GUIONES RESUMIDOS PARA ACTORES

### Actor 01: El Mensajero (Camellón de los Mártires)
* **Objetivo:** Entregar la carta secundaria y sembrar urgencia.
* **Acción:** Observa discretamente al grupo. Al verlos escanear la pista del Camellón, se acerca de forma apresurada y les tiende un sobre envejecido.
* **Diálogo:** *"Llegaron demasiado tarde... Ellos ya saben lo que buscan. No confíen en todo lo que escuchan de esa máquina."* (Se retira rápidamente perdiéndose entre la multitud).

### Actor 02: El Falsificador (Castillo San Felipe)
* **Objetivo:** Generar la falsa derrota en el punto medio de la historia.
* **Acción:** Se presenta como un restaurador o contacto local sospechoso. Muestra un contenedor con cenizas y un diario parcialmente quemado.
* **Diálogo:** *"Lo siento por Isabella... pero lo que buscaban fue destruido. El fuego consumió las últimas páginas del Manuscrito en las bóvedas de San Felipe. Aquí no hay nada más que cenizas."*

### Actor 03: El Guardián (Murallas de Cartagena)
* **Objetivo:** Cierre de experiencia y legitimación de los nuevos custodios.
* **Acción:** Viste ropa formal oscura. Al aproximarse los jugadores con la secuencia maestra descifrada, los recibe de forma solemne.
* **Diálogo:** *"Ustedes han visto lo que otros intentaron borrar de la historia. El Manuscrito Prohibido no es oro, ni un libro físico... Es la Clasificación de nuestro saber. Hoy, ustedes asumen la responsabilidad como Guardianes. Bienvenidos a la custodia."* (Entrega la moneda de bronce y el certificado oficial).

---

## CRONOGRAMA MINUTO A MINUTO (DURACIÓN STANDARD: 90 MIN)

* **Minuto 00 – 05:** Registro, validación de código único y entrega del kit físico de investigación por el Operador. Briefing de seguridad.
* **Minuto 05 – 15:** Estaciones 1 & 2 (Las Bóvedas y Camellón de los Mártires). Activación de telemetría inicial y primer video de Isabella Hidalgo. Encuentro con El Mensajero.
* **Minuto 15 – 35:** Estaciones 3 a 5 (Plaza de la Aduana, San Pedro Claver, Torre del Reloj). Criptografía de fechas históricas (1811) y contradicciones del Testigo. Descubrimiento del Patrón.
* **Minuto 35 – 55:** Estaciones 6 & 7 (Getsemaní y Castillo San Felipe). Encontrando "Cenizas" con El Falsificador. Bloqueo temporal de fe en la misión.
* **Minuto 55 – 70:** Estaciones 8 & 9 (Parque Apolo y regreso táctico). Cuestionamiento de las directivas de ARIADNA y resolución del sobre sellado.
* **Minuto 70 – 85:** Estaciones 10 & 11 (Apertura del sobre y descifrado de letras acumuladas: **M-A-R-T-I-R-A-D-O-R**). Descubrimiento de que el manuscrito es el sistema de clasificación de conocimientos.
* **Minuto 85 – 90:** Estación 12 (Cierre en las Murallas). Encuentro solemne con El Guardián, entrega de coleccionables, toma de foto grupal geolocalizada y entrega del certificado impreso/digital.

---

## LOGÍSTICA DE MATERIALES E INVENTARIO

| Material | Tipo | Uso | Cantidad de Reserva Recomendada |
|----------|------|-----|---------------------------------|
| **Caja de Investigación** | Rígida Premium (Reusable) | Contenedor principal de activos | 15 unidades por operador |
| **Mapa Histórico** | Consumible Papel Pergamino | Guía espacial offline | 50 copias semanales |
| **Libreta de Notas** | Consumible Impreso | Anotaciones de pistas y evidencias | 50 unidades semanales |
| **Lupa de Aumento** | Permanente Acero/Vidrio | Inspección de micro-pistas | 15 unidades por operador |
| **Sobre Sellado** | Consumible Lacrado | Revelación final | 50 unidades semanales |
| **Moneda de Bronce** | Coleccionable Metal | Premio físico individual | 200 unidades mensuales |
| **Tarjetas QR/NFC** | Reusable Plástico | Activación de telemetría móvil | 30 unidades |

---

## MODELO DE NEGOCIO MÍNIMO (FRANQUICIA EXPANSIVA)

Para expandir la experiencia inmersiva a otras ciudades de Colombia (Santa Marta, Barranquilla, Sincelejo, Montería) sin comprometer el capital de la empresa matriz, se propone el siguiente modelo de Franquicia Operativa:

1. **Canon de Entrada Bajo Costo:** Pago único que incluye el software de administración (Ariadna Admin), capacitación de actores y transferencia del lore narrativo.
2. **Suministro de Consumibles Centralizado:** La matriz diseña y envía los materiales impresos premium (libretas, mapas, monedas, sobres sellados) cobrando un valor fijo por kit de equipo para asegurar uniformidad estética.
3. **Regalías (Royalty) por Sesión:** 15% sobre las reservas digitales capturadas en la plataforma de pagos unificada.
4. **Infraestructura Cloud Compartida:** Multi-tenant a través de la misma base de datos Supabase, reduciendo costos de servidores a cero durante la fase de validación en el mercado.

---

## PLAN DE CAPACITACIÓN PARA ACTORES (8 HORAS)

* **Módulo I: Lore y Tono Narrativo (2 Horas):** Estudio de la biblia de la conspiración y perfil de Isabella Morales. Dinámicas para asimilar el suspenso cinematográfico.
* **Módulo II: Manejo de Jugadores e Improvisación (2 Horas):** Técnicas para reaccionar ante preguntas imprevistas sin salirse del personaje ("romper la cuarta pared"). Protocolos ante sospechas de asalto o risas del público.
* **Módulo III: Prácticas en Locación Real (2 Horas):** Ensayos físicos y de posicionamiento discreto en el Camellón de los Mártires, el Castillo de San Felipe y las Murallas.
* **Módulo IV: Seguridad y Sincronización Móvil (2 Horas):** Manejo de la app de operador, coordinación de tiempos de llegada y protocolos de emergencia SOS.

---

## CONTROL DE CALIDAD Y REGLAS DE ORO

1. **La regla de los 5 minutos:** Ningún actor o elemento físico de campo puede estar fuera de su posición transcurrido el tiempo estimado en el cronograma.
2. **Estética Libre de AI-Slop:** Ningún material impreso, folleto o manual entregado al usuario debe exhibir imperfecciones gráficas o textos robóticos sin sentido. La elegancia artesanal es el mayor valor de City Quest Explorer.
3. **No romper el suspenso:** Si un transeúnte o turista ajeno al juego interactúa con los actores, estos deberán responder de forma evasiva manteniendo la intriga sin arruinar la experiencia para los jugadores activos.

**FIN DEL DOCUMENTO**
