const fs=require('fs'),vm=require('vm');
const doc={addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return[]},createElement(){return{style:{},classList:{add(){}},setAttribute(){}}},documentElement:{},body:{}};
const w={document:doc,addEventListener(){},localStorage:{getItem(){return null},setItem(){}},location:{search:'',href:''},navigator:{},matchMedia(){return{matches:false,addListener(){}}}};
w.window=w;w.self=w;const ctx=vm.createContext(Object.assign(w,{console}));
for(const f of ['data.js','data-extra.js','i18n.js','i18n-conteudo.js']){try{vm.runInContext(fs.readFileSync(f,'utf8')+'\n;',ctx,{filename:f})}catch(e){console.error(f,e.message)}}
const r=vm.runInContext(`(function(){const L=[];const vis=new Set();['mecanismo','beneficios','evidencia','riscos','status','protocolo'].forEach(f=>PEPTIDES.forEach(p=>{const s=p[f];if(typeof s==='string'&&s.trim()&&!I18N.en[s.trim()]&&!I18N.en[s]&&!vis.has(s)){vis.add(s);L.push(s)}}));return L})()`,ctx);
console.error(r.length);fs.writeFileSync('slice4.json',JSON.stringify(r.slice(351,468),null,1),'utf8');
