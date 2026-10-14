(function(){
  const B=window.BAR,$=s=>document.querySelector(s);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  document.querySelectorAll("[data-bind]").forEach(e=>e.textContent=B[e.dataset.bind]);
  const SK="bar_admin_ok";
  const ss={get:()=>{try{return sessionStorage.getItem(SK)}catch(e){return null}},set:v=>{try{v?sessionStorage.setItem(SK,"1"):sessionStorage.removeItem(SK)}catch(e){}}};
  const show=ok=>{$("#login").classList.toggle("hidden",ok);$("#app").classList.toggle("hidden",!ok);if(ok)render()};
  show(!!ss.get());
  $("#lf").onsubmit=e=>{e.preventDefault();
    if($("#u").value===B.adminUser&&$("#p").value===B.adminPass){ss.set(1);show(true)}
    else $("#err").textContent="Usuario o contraseña incorrectos.";};
  $("#out").onclick=()=>{ss.set(0);$("#p").value="";show(false)};

  const fmt=iso=>{const[y,m,d]=iso.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"short"})};
  const label={pendiente:"Pendiente",confirmada:"Confirmada",cancelada:"Cancelada"};

  function render(){
    const all=Store.all().sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora));
    const today=new Date().toISOString().slice(0,10);
    const cnt=s=>all.filter(r=>r.status===s).length;
    const covers=all.filter(r=>r.status==="confirmada"&&r.personas!=="+").reduce((n,r)=>n+(+r.personas||0),0);
    $("#stats").innerHTML=[[cnt("pendiente"),"Pendientes"],[cnt("confirmada"),"Confirmadas"],[covers,"Comensales confirmados"],[all.length,"Total"]].map(s=>`<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("");
    const fs=$("#fs").value,fd=$("#fd").value,q=$("#fq").value.toLowerCase();
    const rows=all.filter(r=>(!fs||r.status===fs)&&(!fd||r.fecha===fd)&&(!q||(r.nombre+r.tel).toLowerCase().includes(q)));
    $("#list").innerHTML=rows.length?rows.map(r=>{
      const msg=encodeURIComponent(`Hola ${r.nombre}, te confirmamos tu reserva en ${B.name} para ${r.personas==="+"?"vuestro grupo":r.personas+" persona(s)"} el ${fmt(r.fecha)} a las ${r.hora}. ¡Os esperamos!`);
      const num=r.tel.replace(/[^\d]/g,"");
      return `<div class="res"><div class="when"><b>${r.hora}</b><span>${esc(fmt(r.fecha))}${r.fecha<today?" · pasada":""}</span></div>
      <div><h3>${esc(r.nombre)} · ${r.personas==="+"?"Grupo grande":esc(r.personas)+" pers."} <span class="badge b-${r.status}">${label[r.status]}</span></h3>
      <p>${esc(r.tel)} · ref. ${esc(r.id)}</p>${r.coment?`<p class="cm">“${esc(r.coment)}”</p>`:""}</div>
      <div class="act">
        ${r.status!=="confirmada"?`<button class="btn btn-sm ok" data-a="confirmada" data-id="${r.id}">Confirmar</button>`:""}
        <a class="btn btn-sm btn-ghost" target="_blank" rel="noopener" href="https://wa.me/${num}?text=${msg}">WhatsApp</a>
        <a class="btn btn-sm btn-ghost" href="tel:${esc(r.tel)}">Llamar</a>
        ${r.status!=="cancelada"?`<button class="btn btn-sm btn-ghost dng" data-a="cancelada" data-id="${r.id}">Cancelar</button>`:`<button class="btn btn-sm btn-ghost dng" data-a="del" data-id="${r.id}">Borrar</button>`}
      </div></div>`}).join(""):`<div class="empty">No hay reservas${all.length?" con esos filtros":" todavía"}.</div>`;
  }
  $("#list").onclick=e=>{const b=e.target.closest("[data-a]");if(!b)return;
    if(b.dataset.a==="del"){if(confirm("¿Borrar esta reserva definitivamente?"))Store.remove(b.dataset.id)}
    else Store.setStatus(b.dataset.id,b.dataset.a);
    render()};
  ["fs","fd","fq"].forEach(i=>$("#"+i).addEventListener("input",render));
  addEventListener("storage",()=>{if(ss.get())render()});

  $("#demo").onclick=()=>{
    const next=dow=>{const d=new Date();while(d.getDay()!==dow)d.setDate(d.getDate()+1);return d.toISOString().slice(0,10)};
    [["Persona de ejemplo A","600 000 001","2",next(5),"21:00","Aniversario"],["Persona de ejemplo B","600 000 002","4",next(6),"20:30",""],["Persona de ejemplo C","600 000 003","6",next(6),"22:00","Una trona, por favor"]]
      .forEach(a=>Store.add({nombre:a[0],tel:a[1],personas:a[2],fecha:a[3],hora:a[4],coment:a[5]}));
    render()};
  $("#csv").onclick=()=>{
    const rows=[["ref","estado","fecha","hora","personas","nombre","telefono","comentarios","creada"],...Store.all().map(r=>[r.id,r.status,r.fecha,r.hora,r.personas,r.nombre,r.tel,r.coment||"",r.createdAt])];
    const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(";")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv"}));a.download="reservas.csv";a.click()};
})();
