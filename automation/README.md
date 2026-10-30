# Entrada desde AutoVideo

El botón **Importar de AutoVideo** recibe dos archivos seleccionados juntos: el MP4/WebM terminado y su `.clipfarming.json`, creado desde **Clips → Preparar para ClipFarming** en AutoVideo.

El contrato compartido es `autovideo-clipfarming/v1`, implementado en `media-contract.js`. Ambas aplicaciones deben utilizar la misma versión del contrato.

- Se comprueban nombre, tamaño, SHA-256 y duración del vídeo antes de cargarlo. Límite: 512 MiB de vídeo y 20 MiB de JSON.
- Los subtítulos y los cortes se validan dentro de la duración. Los cortes recibidos no pueden superar 150 s.
- Se conserva el idioma y el identificador del encargo; este último también se conserva en los proyectos de Corta Studio.
- La importación activa el modo local y desmarca el consentimiento para enviar contenido a Google. No hace solicitudes de análisis ni publicaciones.
- Si el vídeo ya tiene subtítulos incrustados, se desactiva la sobreimpresión para evitar duplicarlos. Revisa el encuadre y los cortes antes de exportar.

Las imágenes y el audio no se transfieren como elementos editables: ClipFarming trabaja sobre el vídeo terminado. No hay un servicio que vigile carpetas o importe archivos sin que el usuario los seleccione.

## Pruebas

```sh
npm test
```

La prueba real entre aplicaciones está en `tests/browser.cjs` del checkout de AutoVideo que acompaña esta fase. Ejecútala desde ese checkout con `CLIPFARMING_DIR` apuntando a este repositorio. Usa Chromium aislado, imágenes y audio sintéticos, bloquea el acceso a proveedores y exporta un vídeo y un clip locales.
