(()=>{importScripts("./lib/webperl.js");addEventListener("message",({data:a})=>{let{code:i,args:s,input:n}=a;Perl.output=(t,e)=>{if(e===2){postMessage({type:"output",error:t});return}postMessage({type:"output",output:t})},Perl.init(()=>{let t="",e="";Perl.start([]),Perl.stdin_buf+=n;let r=s.match(/F(\S+)?/);r?t=`@F = split/\\Q${r[1]??"".replace(/^\/|\/$/g,"")}/,$_;
`+t:s.match(/a/)&&(t=`@F = grep$_,split/\\s+/,$_;
`+t),s.match(/p/)&&(e+=`;
print;
`+e),s.match(/l/)&&(t=`$\\=$/;
chomp;
`+t),s.match(/[anpF]/)&&(t=`while(<STDIN>) {
`+t,e+=`;
}
`);let l=Perl.eval([...[...t].map(p=>p.charCodeAt()),...i,...[...e].map(p=>p.charCodeAt())]);Perl.end(),postMessage({type:"done",result:l,output:Perl.stdout_buf})})});})();
//# sourceMappingURL=worker.js.map
