(()=>{var o=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var s=o((exports,module)=>{addEventListener("message",({data})=>{let{code,input}=data;prompt=()=>input,console.log=(...e)=>{postMessage({type:"output",output:e.join("")+`
`})},console.warn=console.error=console.debug=(...e)=>{postMessage({type:"output",error:e.join("")+`
`})};let result;try{result=eval(code.map(e=>String.fromCharCode(e)).join("")),result instanceof Function&&(result=result(input))}catch(e){postMessage({type:"output",error:e.message}),result=null}postMessage({type:"done",output:result})})});s();})();
//# sourceMappingURL=worker.js.map
