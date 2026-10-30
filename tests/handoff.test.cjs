const {test}=require('node:test'),assert=require('node:assert/strict');
const {FORMAT,validateHandoff}=require('../automation/media-contract.js');
const valid={format:FORMAT,video:{name:'master.mp4',size:100,duration:10,sha256:'a'.repeat(64)},language:'en',jobId:'finance_en_001',subtitlesBurned:true,cues:[{start:0,end:2,text:'Hello'}],clips:[{start:0,end:4,title:'Opening'}]};
test('preserves job, language, captions and cut times',()=>{const x=validateHandoff(valid);assert.equal(x.jobId,valid.jobId);assert.equal(x.language,'en');assert.equal(x.subtitlesBurned,true);assert.deepEqual(x.cues,valid.cues);assert.deepEqual(x.clips,valid.clips);});
test('rejects mismatched schema, invalid identity and times',()=>{
 for(const change of [{format:'wrong'},{video:{...valid.video,sha256:'bad'}},{language:'fr'},{cues:[{start:0,end:20,text:'bad'}]},{clips:[{start:3,end:1,title:'bad'}]}])assert.throws(()=>validateHandoff({...valid,...change}));
});
