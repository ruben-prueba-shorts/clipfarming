# Puente de producción — ClipFarming

Este repositorio está preparado para recibir en el futuro los vídeos exportados desde AutoVideo Studio. No se modifica el motor de exportación original.

## Contrato entre los dos editores

1. AutoVideo Studio prepara un MP4 a partir del guion, la narración y las imágenes.
2. ClipFarming importa el **archivo MP4 original** con su interfaz actual.
3. ClipFarming puede importar después un archivo de proyecto `corta-studio/v1` con cortes y subtítulos, siempre que el nombre, tamaño y duración del MP4 coincidan exactamente.
4. El formato de planificación previo a la producción es `video-factory-job/v1`, definido en el repositorio `autovideostudio/automation`. No debe confundirse con el proyecto de edición de clips.

## Próxima integración

Implementar un generador de proyectos `corta-studio/v1` tras obtener las marcas de tiempo del MP4 y los subtítulos. Validar sus límites: máximo 250 clips y duración de clip no superior a 150 segundos. No enviar claves Gemini ni tokens de YouTube al navegador mediante archivos de proyecto.

## Estado

Esta rama solo documenta el puente. No automatiza la importación de MP4 ni su publicación en YouTube.
