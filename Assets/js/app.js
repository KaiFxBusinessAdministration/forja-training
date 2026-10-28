const FLOW_CLIENTES_FALLBACK = [
{id:1,nombre:"Juan Pérez",edad:28,peso:82,altura:1.78,objetivo:"Hipertrofia",estado:"Activo",entrenador:"Andrés Vega"},
{id:2,nombre:"María López",edad:32,peso:65,altura:1.65,objetivo:"Pérdida de grasa",estado:"Activo",entrenador:"Andrés Vega"},
{id:3,nombre:"Carlos Andrade",edad:35,peso:90,altura:1.82,objetivo:"Fuerza",estado:"Activo",entrenador:"Andrés Vega"},
{id:4,nombre:"Ana Torres",edad:25,peso:58,altura:1.60,objetivo:"Tonificación",estado:"Pendiente",entrenador:"Andrés Vega"},
{id:99,nombre:"Carlos Demo",edad:34,peso:88,altura:1.80,objetivo:"Hipertrofia",estado:"Activo",entrenador:"Andrés Vega",tipoSeguimiento:"Preparación para competencia",objetivoDeportivo:"Mejorar composición corporal y rendimiento",suplementacion:"Proteína y creatina, según planificación profesional",seguimientoMedico:"Registro declarado por el atleta; validar con médico especialista",notasRendimiento:"Priorizar recuperación, técnica y progresión controlada"}
];

window.flowLoadClientes = async function(path){
let base;
try{
const response = await fetch(path);
if(!response.ok){
throw new Error("No se pudo cargar clientes.json");
}
base = await response.json();
}catch(error){
base = FLOW_CLIENTES_FALLBACK;
}
const adicionales = JSON.parse(localStorage.getItem("flowClientesAdicionales") || "[]");
const actualizados = JSON.parse(localStorage.getItem("flowClientesActualizados") || "[]");
const clientes = new Map([...base,...adicionales].map(cliente=>[String(cliente.id),cliente]));
actualizados.forEach(cliente=>clientes.set(String(cliente.id),{...(clientes.get(String(cliente.id)) || {}),...cliente}));
return [...clientes.values()];
};

document.addEventListener("DOMContentLoaded",()=>{

const brandLinks=document.querySelectorAll(".brand, .brand a, [data-home-logout]");
brandLinks.forEach(brand=>{
brand.setAttribute("role","link");
brand.setAttribute("tabindex","0");
brand.setAttribute("title","Cerrar sesión y volver al inicio");
const goHome=()=>{
sessionStorage.removeItem("flowClienteActivoId");
sessionStorage.removeItem("flowAuthRole");
localStorage.removeItem("flowTrainerSession");
localStorage.removeItem("flowClientSession");
window.location.href="../index.html";
};
brand.addEventListener("click",event=>{
if(event.target.closest("a")){event.preventDefault();}
goHome();
});
brand.addEventListener("keydown",event=>{
if(event.key==="Enter" || event.key===" "){event.preventDefault();goHome();}
});
});


const links=document.querySelectorAll(".sidebar a");


links.forEach(link=>{


link.addEventListener("click",()=>{


links.forEach(item=>{

item.classList.remove("active");

});


link.classList.add("active");


});


});



const cards=document.querySelectorAll(".kpi-card");


cards.forEach(card=>{


card.addEventListener("mouseenter",()=>{

card.style.transform="translateY(-8px)";

});


card.addEventListener("mouseleave",()=>{

card.style.transform="translateY(0)";

});


});

const demoClientLinks=document.querySelectorAll("[data-demo-client-entry]");

demoClientLinks.forEach(link=>{

link.addEventListener("click",()=>{
sessionStorage.setItem("flowClienteActivoId","99");
});

});

const whatsappLinks=document.querySelectorAll("[data-whatsapp-message]");

whatsappLinks.forEach(link=>{

const config=window.FLOW_CONFIG || {};
const number=config.WHATSAPP_NUMBER || "WHATSAPP_NUMBER";
const message=encodeURIComponent(link.dataset.whatsappMessage);

if(!/^\d{8,15}$/.test(number)){

link.href="#";
link.removeAttribute("target");
link.removeAttribute("rel");
link.classList.add("is-disabled");
link.title="WhatsApp no configurado";
link.setAttribute("aria-disabled","true");
link.addEventListener("click",(event)=>{
event.preventDefault();
});

return;

}

link.href=`https://wa.me/${number}?text=${message}`;
link.target="_blank";
link.rel="noopener";
link.classList.remove("is-disabled");
link.removeAttribute("aria-disabled");

});

document.querySelectorAll("[data-profile-upload]").forEach(input=>input.addEventListener("change",()=>{
const file=input.files[0];
if(!file){return;}
if(file.size>5*1024*1024){
alert("La foto debe pesar menos de 5 MB.");
input.value="";
return;
}
const reader=new FileReader();
reader.onload=()=>{
const key=`flowFotoPerfil_${input.dataset.profileUpload}`;
localStorage.setItem(key,reader.result);
document.querySelectorAll(`[data-profile-image="${input.dataset.profileUpload}"]`).forEach(image=>{
image.src=reader.result;
});
};
reader.readAsDataURL(file);
}));

document.querySelectorAll("[data-profile-trigger]").forEach(image=>{
image.addEventListener("click",()=>document.querySelector(`[data-profile-upload="${image.dataset.profileTrigger}"]`)?.click());
});

document.querySelectorAll("[data-profile-image]").forEach(image=>{
const saved=localStorage.getItem(`flowFotoPerfil_${image.dataset.profileImage}`);
if(saved){image.src=saved;}
});

const isClientPortal=window.location.pathname.includes("/Cliente/") && !window.location.pathname.endsWith("/login.html");

if(isClientPortal){

const params=new URLSearchParams(window.location.search);

if(params.get("demo")==="1"){
sessionStorage.setItem("flowClienteActivoId","99");
}

const activeClientId=sessionStorage.getItem("flowClienteActivoId") || "99";

window.flowLoadClientes("../Data/clientes.json")
.then(clientes=>{

const cliente=clientes.find(item=>String(item.id)===activeClientId) || clientes.find(item=>item.nombre.toLowerCase().includes("demo")) || clientes[0];

if(!cliente){
return;
}

document.querySelectorAll("[data-client-field]").forEach(element=>{

const field=element.dataset.clientField;

const values={
nombre:cliente.nombre,
nombreCorto:cliente.nombre.split(" ")[0],
edad:cliente.edad,
peso:`${cliente.peso} kg`,
altura:`${cliente.altura} m`,
objetivo:cliente.objetivo,
estado:cliente.estado,
entrenador:cliente.entrenador,
tipoSeguimiento:cliente.tipoSeguimiento || "General",
objetivoDeportivo:cliente.objetivoDeportivo || "-",
suplementacion:cliente.suplementacion || "-",
seguimientoMedico:cliente.seguimientoMedico || "-",
notasRendimiento:cliente.notasRendimiento || "-"
};

if(values[field]!==undefined){
element.textContent=values[field];
}

});

const esRendimiento=['Rendimiento','Preparación para competencia'].includes(cliente.tipoSeguimiento);
document.querySelectorAll('[data-performance-panel]').forEach(panel=>{panel.hidden=!esRendimiento;});

})
.catch(()=>{});

}



});






