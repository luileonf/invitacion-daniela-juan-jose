# Invitación digital de Daniela y Juan José

Sitio estático para compartir una invitación digital con:

- invitación de boda
- invitación de recepción
- mesa de regalos
- confirmación por WhatsApp
- panel de novios para generar links personalizados

## Links personalizados

Entra a la sección **Novios** y agrega invitados manualmente o importa un CSV con columnas:

```csv
nombre,pases,nota
Familia Pérez,4,Mesa 2
María López,1
```

El panel genera links con el nombre del invitado y sus pases, por ejemplo:

```text
https://tuevento.com/danielayjuanjose?invitado=Familia%20P%C3%A9rez&pases=4
```

## Publicar en Vercel

1. Sube el proyecto a GitHub.
2. Conecta el repositorio en Vercel.
3. Framework preset: `Other`.
4. Build command: dejar vacío.
5. Output directory: dejar vacío.

La app es estática y funciona directamente desde `index.html`.
