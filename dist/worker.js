(()=>{importScripts("../../lib/webperl/webperl.js");addEventListener("message",({data:s})=>{let{code:p,args:t,input:i}=s;Perl.output=(e,r)=>{if(e=e.replace(/(?<!\r)\n/g,`\r
`),r===2){postMessage({type:"output",error:e});return}postMessage({type:"output",output:e})},Perl.endAfterMain=!0,Perl.addStateChangeListener((e,r)=>{r==="Ended"&&postMessage({type:"done"})}),Perl.init(()=>{Perl.stdin_buf+=i,Perl.run(p,t?t.split(/\n/):[])})});})();
//# sourceMappingURL=worker.js.map
