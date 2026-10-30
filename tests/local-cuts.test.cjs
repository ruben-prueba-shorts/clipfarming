const {test}=require('node:test'),assert=require('node:assert/strict');const f=require('../automation/local-cuts.js');
test('shared offline selector keeps natural boundaries without overlap',()=>{
 const cues=Array.from({length:12},(_,i)=>({start:i*5,end:i*5+4,text:i%3===0?'Imagina este cambio.':'Una explicación completa.'}));
 const r=f.proposeLocal(60,3,15,4,20,f.buildBoundaries(60,cues,[],[]),cues,[]);assert.ok(r.length>=2);
 for(const c of r){assert.ok(c.start>=0&&c.end<=60);assert.equal(c.warning,false);assert.equal(c.score,null);}
 for(let i=1;i<r.length;i++)assert.ok(r[i].start>=r[i-1].end);
});
test('short source yields a bounded proposal without claimed virality',()=>{
 const cues=[{start:.2,end:3,text:'Una historia completa.'}],r=f.proposeLocal(3.2,3,60,20,80,f.buildBoundaries(3.2,cues,[],[]),cues,[]);
 assert.equal(r.length,1);assert.equal(r[0].score,null);assert.ok(r[0].end<=3.2);
});
