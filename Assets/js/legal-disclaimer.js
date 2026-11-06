(function(){
  const modal=document.createElement("div");
  modal.className="legal-dialog";
  modal.setAttribute("role","dialog");
  modal.setAttribute("aria-modal","true");
  modal.setAttribute("aria-labelledby","accessLegalTitle");
  modal.innerHTML=`<div class="legal-dialog-card"><h2 id="accessLegalTitle">⚠️ Descargo de Responsabilidad Legal</h2><div class="legal-dialog-body"><p><strong>1. No es asesoría médica ni profesional</strong><br>El contenido, los programas, los entrenamientos y la información nutricional compartidos en la plataforma <strong>forjaentrenamiento.vercel.app</strong>, así como por sus creadores y entrenadores, son estrictamente para fines educativos e informativos. <strong>No constituyen, ni sustituyen, una consulta, diagnóstico o tratamiento médico profesional.</strong></p><p><strong>2. Consentimiento y asunción de riesgo</strong><br>Antes de comenzar cualquier programa de ejercicio, plan de alimentación o suplementación facilitado por este sitio, te recomendamos encarecidamente consultar con un médico o profesional de la salud calificado. Al participar en estas rutinas o seguir estos consejos, <strong>asumes voluntariamente todo el riesgo de sufrir lesiones corporales, problemas de salud o daños</strong> derivados de dicha práctica.</p><p><strong>3. Exoneración de responsabilidad</strong><br><strong>forjaentrenamiento.vercel.app</strong>, sus creadores, desarrolladores y entrenadores no se hacen responsables de ninguna lesión, dolencia, pérdida o daño (directo o indirecto) que pueda ocurrir como resultado del uso, mal uso o confianza en la información, plataformas y los entrenamientos proporcionados en este espacio. <strong>Tu salud es tu responsabilidad.</strong></p></div><div class="legal-dialog-actions"><button type="button" class="btn-secondary" data-legal-reject>Rechazar</button><button type="button" class="btn-primary" data-legal-accept>Aceptar y continuar</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-legal-accept]").focus();
  modal.querySelector("[data-legal-reject]").addEventListener("click",()=>{location.href="../index.html";});
  modal.querySelector("[data-legal-accept]").addEventListener("click",()=>{modal.remove();});
})();
