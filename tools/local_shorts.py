#!/usr/bin/env python3
"""ClipFarming's shared local selection and FFmpeg vertical exporter. No API."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

AUTO_ROOT = Path(__file__).resolve().parents[2]/'autovideostudio'
sys.path.insert(0, str(AUTO_ROOT/'tools'))
import local_factory as factory


def select(handoff, count=3, target=60, flex=20, editorial=None):
    if editorial:
        picks = []
        for item in editorial:
            a, b = item['start'], item['end']
            if not 0 <= a < b <= handoff['video']['duration'] or b-a > 150:
                raise ValueError('Editorial clip outside the master or over 150 seconds')
            if any(min(b, p['end'])-max(a, p['start']) > .05 for p in picks):
                raise ValueError('Editorial clips overlap')
            picks.append({**item, 'id': 'short-'+str(len(picks)+1).zfill(2), 'source': 'script-editorial-plan', 'score': None,
                          'warning': False, 'overlay': '', 'selected': True, 'needsEditorialReview': True})
        return picks
    js = """const f=require(process.argv[1]);let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>{
    const p=JSON.parse(s),h=p.h,b=f.buildBoundaries(h.video.duration,h.cues,[],[]);
    const r=f.proposeLocal(h.video.duration,p.count,p.target,p.flex,Math.min(150,p.target+p.flex),b,h.cues,[]);
    process.stdout.write(JSON.stringify(r.map(({id,...c},i)=>({...c,id:'short-'+String(i+1).padStart(2,'0'),needsEditorialReview:true}))));});"""
    r = subprocess.run(['node', '-e', js, str(Path(__file__).resolve().parents[1]/'automation/local-cuts.js')],
                       input=json.dumps({'h': handoff, 'count': count, 'target': target, 'flex': flex}).encode(),
                       capture_output=True, check=True, timeout=30)
    return json.loads(r.stdout)


def export(master, handoff, output, heartbeat=lambda: None, count=3, target=60, flex=20, height=1280, editorial=None):
    master, output = Path(master).resolve(), Path(output).resolve()
    if handoff['subtitlesBurned']:
        raise ValueError('Local vertical export requires a clean master')
    if factory.digest(master) != handoff['video']['sha256']:
        raise ValueError('Master differs from handoff')
    picks = select(handoff, count, target, flex, editorial)
    if not picks:
        raise ValueError('No local candidate; editorial selection required')
    output.mkdir(parents=True, exist_ok=True); results = []; width = height*9//16
    for pick in picks:
        heartbeat(); work = output/pick['id']; work.mkdir(exist_ok=True)
        final, receipt = work/'short.mp4', work/'result.json'
        key = hashlib.sha256(factory.encoded({'version': 1, 'pick': pick, 'video': handoff['video'], 'cues': handoff['cues'], 'height': height})).hexdigest()
        if receipt.exists() and final.exists():
            prior = json.loads(receipt.read_text())
            if prior['key'] == key and factory.digest(final) == prior['sha256']:
                results.append({**prior, 'path': str(final), 'reused': True}); continue
        duration = pick['end']-pick['start']
        factory.captions(work/'captions.ass', handoff['cues'], pick['start'], pick['end'], width, height)
        vf = (f'[0:v]split=2[b][f];[b]scale={width}:{height}:force_original_aspect_ratio=increase,'
              f'crop={width}:{height},boxblur=20:2[b];[f]scale={width}:{height}:force_original_aspect_ratio=decrease[f];'
              '[b][f]overlay=(W-w)/2:(H-h)/2,setsar=1,ass=captions.ass,format=yuv420p[v]')
        temp = work/'short.partial.mp4'
        factory.execute(['ffmpeg', '-v', 'error', '-y', '-threads', '2', '-filter_complex_threads', '1',
                         '-protocol_whitelist', 'file,pipe', '-ss', str(pick['start']), '-i', str(master), '-t', str(duration),
                         '-filter_complex', vf, '-map', '[v]', '-map', '0:a:0', '-r', '30', '-c:v', 'libx264',
                         '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-threads', '2', '-c:a', 'aac',
                         '-ar', '48000', '-b:a', '192k', '-movflags', '+faststart', str(temp)], work, heartbeat,
                        {'peakFfmpegRssBytes': 0}, timeout=max(600, duration*8))
        audit = json.loads(subprocess.check_output(['node', str(AUTO_ROOT/'tools/audit-mp4.cjs'), str(temp), str(duration), 'vertical']))
        temp.replace(final)
        result = {'key': key, 'path': str(final), 'sha256': factory.digest(final), 'selection': pick,
                  'audit': {**audit, 'file': final.name}, 'reused': False, 'needsEditorialReview': True}
        factory.atomic_json(receipt, result); results.append(result)
    return results
