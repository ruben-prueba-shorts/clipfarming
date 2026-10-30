# Primer Short con material real — 30 de octubre de 2026

El orquestador central de AutoVideo puede utilizar ahora `tools/local_shorts.py` para seleccionar y exportar sin navegador, usando los mismos selectores locales que este editor. El código común vive en `automation/local-cuts.js`; no se duplicó el algoritmo. También acepta un plan editorial del guion con intervalos de escenas alineadas, sin solicitar Gemini.

La continuación reutilizó el maestro real existente de Mako/Flow y produjo un nuevo Short local H.264/AAC de **25,807479 s**, con carpeta completa de entrega. El proyecto y el maestro copiados se importaron de nuevo en la interfaz del editor, comprobando identidad, 25 cues y restauración de cortes. Se probaron además tres Shorts de escenas completas en un encargo sintético conectado. La selección local es heurística o procede del plan editorial; no se presenta como comprensión semántica garantizada ni predicción viral. Todos los resultados quedan para revisión.

Detalle: [Orquestador](https://github.com/ruben-prueba-shorts/autovideostudio/blob/fix/flow-images-project-persistence/automation/ORCHESTRATOR.md) y [resultados medidos](https://github.com/ruben-prueba-shorts/autovideostudio/blob/fix/flow-images-project-persistence/automation/validation/orchestrator-results.json). No se repitieron generaciones ni pruebas largas.

El PR #2 sigue en borrador, sin fusión ni despliegue. Se importó en esta rama el MP4 **H.264/AAC** limpio de AutoVideo PR #3 y el JSON generado para **ese mismo archivo**, con hash/tamaño/duración coincidentes.

El material procede de tres imágenes existentes de Flow, prompts **102 → 110 → 97**, y **una sola narración gratuita autorizada** de **Mako / Gemini 3.8 Flash TTS**. La voz tiene 25,8 segundos. ClipFarming no solicitó una voz ni ejecutó Gemini: importación, subtítulos y exportación fueron locales en Chromium aislado.

Se comprobaron el identificador `football_real_smoke_001`, modo local y **25 cues**. Se añadió como corte manual el intervalo completo de esta muestra corta. No se presenta como selección editorial autónoma de momentos de un vídeo largo.

El editor exportó un vertical **720×1280**, imagen completa sobre fondo difuminado y subtítulos blancos con contorno, sin duplicar subtítulos del maestro (se había enviado limpio). El Chromium de prueba produjo VP9/Opus: la copia final se convirtió con FFmpeg a **H.264/yuv420p, 30 fps, AAC/48 kHz y faststart** y pasó la auditoría de duración y decodificación completa. Duración final: **25,746917 s**, frente a 25,800146 s del maestro limpio; diferencia dentro de la tolerancia de 0,15 s.

La comprobación independiente compara las tres imágenes del archivo final, la forma de onda en tres ventanas de cuatro segundos y un fotograma por cada cue. El desfase de audio incluye el inicio de su pista; no se equipara correlación de muestras a una aprobación subjetiva de naturalidad. El usuario aún debe escuchar y aprobar la voz/ritmo. No se publicó en YouTube.

Los tres puntos de imagen conservaron el orden **102 → 110 → 97**. El OCR leyó **25/25 cues** del Short. Las tres ventanas de audio dieron un retraso estable de 71,4 ms respecto al WAV, sin deriva detectada, y correlación mínima 0,996. Pasaron las dos pruebas Node de contrato. No hubo errores JavaScript de página ni llamadas a proveedores de generación durante la importación/exportación.

Código reproducible: `tests/real-integration-browser.cjs` y `tests/inspect-real.py` de AutoVideo PR #3, con etapas de montaje, entrega y exportación. Usa archivos existentes; no genera medios y bloquea llamadas a proveedores durante montaje/exportación.

- [Informe completo y límites](https://github.com/ruben-prueba-shorts/autovideostudio/blob/fix/flow-images-project-persistence/automation/REAL-INTEGRATION.md).
- [Resultados medidos y huellas](https://github.com/ruben-prueba-shorts/autovideostudio/blob/fix/flow-images-project-persistence/automation/validation/real-30-results.json).
- [Recorrido reproducible](https://github.com/ruben-prueba-shorts/autovideostudio/blob/fix/flow-images-project-persistence/automation/FACTORY-RUNBOOK.md).

Pendiente: fijar perfiles de voz tras escucha, validar inglés/finanzas y vídeos largos reales, conectar transferencia/cola y selección de Shorts, y normalizar/auditar automáticamente cada salida en el ejecutor local. El importador y exportador de ClipFarming ya han recibido material real; esto no acredita una fábrica completamente desatendida.
