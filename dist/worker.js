(()=>{importScripts("./lib/webperl.js");addEventListener("message",({data:s})=>{let{code:p,args:i,input:o}=s;Perl.output=(e,t)=>{if(t===2){postMessage({type:"output",error:e});return}postMessage({type:"output",output:e})},Perl.endAfterMain=!0,Perl.addStateChangeListener((e,t)=>{t==="Ended"&&postMessage({type:"done"})}),Perl.init(()=>{let e="",t="";Perl.stdin_buf+=o;let u=Perl.run([...[...e].map(r=>r.charCodeAt()),...p,...[...t].map(r=>r.charCodeAt())],i.split(/\s+/))})});})();
//# sourceMappingURL=worker.js.map
