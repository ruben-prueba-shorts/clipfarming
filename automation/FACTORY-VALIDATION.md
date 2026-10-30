# Recepción de la fábrica — 30 de octubre de 2026

El PR #2 continúa en borrador. No se modifica producción ni se usa Gemini. No se han publicado vídeos.

Se probó el importador de esta rama con un maestro **H.264/AAC** generado mediante el render local del PR #3 de AutoVideo y su `master.clipfarming.json`. Se comprobó identidad, idioma, identificador del encargo, modo local y cuatro cues.

El editor exportó un vídeo **720×1280**, con audio y **30,002133 s**, en unos **30,5 s**. En el Chromium aislado de pruebas produjo VP9/Opus; una copia convertida localmente a H.264/yuv420p + AAC/48 kHz con faststart pasó la auditoría y decodificación completa (30,075632 s). No se afirma que el exportador estándar entregue H.264 en todos los navegadores.

La prueba usa imágenes/etiquetas y un tono **sintéticos**, no voz de AI Studio. No certifica selección narrativa, encuadre de sujetos reales o sincronización acústica. El Short real solicitado sigue pendiente del audio y los originales descargados de Flow/Viral DNA.

También pasaron las dos pruebas Node de contrato y el recorrido anterior entre los dos editores, incluido el rechazo de un hash incorrecto. Los navegadores de pruebas bloquearon las solicitudes externas.

El código reproducible del recorrido nuevo está en `tests/offline-handoff-browser.cjs` de AutoVideo PR #3. Resultados de 2/5/10/18 min, recuperación y límites:

- [Validación de AutoVideo](https://github.com/ruben-prueba-shorts/autovideostudio/blob/fix/flow-images-project-persistence/automation/FACTORY-VALIDATION.md).
- [Instrucciones de la fábrica](https://github.com/ruben-prueba-shorts/autovideostudio/blob/fix/flow-images-project-persistence/automation/FACTORY-RUNBOOK.md).

Para el flujo final se recomienda maestro limpio con cues, para colocar subtítulos después del encuadre vertical. Si se recibe un maestro con texto incrustado, el importador evita duplicarlo pero no puede retirarlo ni garantizar que el recorte mantenga todo el texto visible.
