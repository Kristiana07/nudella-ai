(function(){
  const t=document.currentScript.dataset.token;
  const b=document.createElement("div");
  b.style="position:fixed;bottom:30px;right:30px;width:300px;background:#fff;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,.2)";
  b.innerHTML=`
  <div style="padding:14px;background:#F5F1EC">NUDELLA AI</div>
  <div id="m" style="padding:14px;height:200px;overflow:auto"></div>
  <input id="i" placeholder="Ask..." style="width:100%;border:none;padding:12px">
  `;
  document.body.appendChild(b);
  b.querySelector("#i").onkeydown=async e=>{
    if(e.key==="Enter"){
      const m=b.querySelector("#m"), i=b.querySelector("#i");
      m.innerHTML+=\<div>You: \${i.value}</div>\;
      const r=await fetch("/chat/"+t,{
        method:"POST",
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:i.value})
      });
      m.innerHTML+=\<div>AI: \${(await r.json()).reply}</div>\;
      i.value="";
    }
  };
})();
