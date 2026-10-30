(function () {
  'use strict';
  async function inspectDuration(file) {
    const video=document.createElement('video'),url=URL.createObjectURL(file);
    try {return await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('No se pudo leer el vídeo.')),15000);
      video.onloadedmetadata=()=>{clearTimeout(timer);resolve(video.duration);};
      video.onerror=()=>{clearTimeout(timer);reject(new Error('Vídeo no compatible.'));};
      video.preload='metadata';video.src=url;
    });} finally {video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
  }
  async function importFiles(files) {
    if(state.busy)return false;
    const list=Array.from(files||[]),json=list.filter(f=>/\.json$/i.test(f.name)),videos=list.filter(f=>/\.(mp4|webm)$/i.test(f.name));
    if(list.length!==2||json.length!==1||videos.length!==1)throw new Error('Selecciona el vídeo y su archivo .clipfarming.json juntos.');
    if(json[0].size>20*1024*1024)throw new Error('La entrega JSON supera 20 MB.');
    const data=VideoFactoryMedia.validateHandoff(JSON.parse(await json[0].text())),file=videos[0];
    if(file.name!==data.video.name||file.size!==data.video.size)throw new Error('El nombre o tamaño no coincide con el vídeo de la entrega.');
    if(state.file&&!confirm('¿Sustituir el vídeo y sus cortes? Guarda el proyecto actual antes de continuar.'))return false;
    const button=document.getElementById('importAutoVideoBtn');button.disabled=true;
    setBusy('handoff');progress('Comprobando entrega…','Verificando el archivo de vídeo y los tiempos de sus subtítulos.',null);
    try {
      if(await VideoFactoryMedia.digest(file)!==data.video.sha256)throw new Error('El vídeo no coincide con la huella de la entrega. Usa el archivo original.');
      const duration=await inspectDuration(file);
      if(!Number.isFinite(duration)||Math.abs(duration-data.video.duration)>.05)throw new Error('La duración del vídeo no coincide con la entrega.');
      setBusy(null);
      await loadFile(file);
      if(state.file!==file)throw new Error('No se pudo abrir el vídeo.');
      state.cues=data.cues;state.subtitleName=json[0].name;state.factoryJobId=data.jobId;
      state.clips=data.clips.map(c=>({id:uid(),start:c.start,end:c.end,title:c.title,reason:'Corte preparado en AutoVideo',source:'manual',score:null,selected:true,overlay:'',warning:false}));
      state.active=null;
      document.querySelector('input[name="mode"][value="local"]').checked=true;
      $('language').value=data.language;$('aiSource').value='subtitles';$('cloudConsent').checked=false;
      $('burnSubs').checked=!data.subtitlesBurned;
      updateSubtitleStatus();updateModes();renderClips();refreshPreview();
      if(state.clips.length)await selectClip(state.clips[0].id);
      $('resultNotice').textContent='Entrega de AutoVideo importada. Revisa el encuadre y los cortes; también puedes buscar más clips en modo local.';
      $('resultNotice').classList.remove('hidden');toast('Vídeo y subtítulos vinculados.');
      return true;
    } finally {setBusy(null);button.disabled=false;}
  }
  const button=document.createElement('button');button.id='importAutoVideoBtn';button.type='button';button.className='btn';button.textContent='Importar de AutoVideo';
  const picker=document.createElement('input');picker.id='autoVideoPackagePicker';picker.type='file';picker.multiple=true;picker.accept='.mp4,.webm,.json';picker.hidden=true;
  button.addEventListener('click',()=>{if(!state.busy)picker.click();});
  picker.addEventListener('change',async()=>{const files=Array.from(picker.files);picker.value='';try{await importFiles(files);}catch(e){banner(e.message);}});
  document.getElementById('importProjectBtn').parentNode.appendChild(button);document.body.appendChild(picker);
  window.AutoVideoBridge={importFiles};
})();
