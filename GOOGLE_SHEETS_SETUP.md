# Conexion del panel de novios a Google Sheets

Hoja creada para esta invitacion:

https://docs.google.com/spreadsheets/d/18eHNul9IiOm2Sibx8mgA77meRDqT-yP_37BwfPmrVv4

## Pasos para activar el guardado compartido

1. Abre https://script.google.com/ con la misma cuenta de Google que tiene acceso a la hoja.
2. Crea un proyecto nuevo.
3. Borra el contenido inicial y pega completo el contenido de `google-apps-script.js`.
4. Guarda el proyecto con un nombre como `Daniela y Juan Jose - RSVP API`.
5. Ve a `Implementar` > `Nueva implementacion`.
6. En tipo selecciona `Aplicacion web`.
7. Configura:
   - Ejecutar como: `Yo`.
   - Quien tiene acceso: `Cualquier persona`.
8. Publica la implementacion y copia la URL que termina en `/exec`.
9. En `data-config.js`, reemplaza el texto vacio de `window.WEDDING_DATA_ENDPOINT = "";` por esa URL.
10. Sube el cambio y la invitacion empezara a guardar invitados y RSVP en la hoja compartida.

## Como validar

- Abre el panel de novios.
- Debe decir `Conectado a la hoja compartida.`
- Agrega un invitado.
- Revisa que aparezca en la pestana `Invitados` de la hoja.
- Abre el link de ese invitado y confirma RSVP.
- Revisa que aparezca en la pestana `RSVP`.
