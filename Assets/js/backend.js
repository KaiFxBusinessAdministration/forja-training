(function(){
  const config = window.FLOW_BACKEND_CONFIG || {};
  const ready = Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY && window.supabase);
  window.FLOW_BACKEND = {
    ready,
    client: ready ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY) : null,
    async requireUser(){
      if(!this.ready) throw new Error("Backend no configurado: falta la URL y la clave anon de Supabase.");
      const {data,error}=await this.client.auth.getUser();
      if(error) throw error;
      if(!data.user) throw new Error("Sesión no iniciada.");
      return data.user;
    },
    async signOut(){
      if(this.ready) await this.client.auth.signOut();
    }
  };
  document.addEventListener("DOMContentLoaded",()=>{
    const path=window.location.pathname;
    const protectedArea=path.includes("/Cliente/") || path.includes("/Entrenador/");
    const isLogin=path.endsWith("/login.html");
    if(!protectedArea || isLogin || !ready)return;
    const expected=path.includes("/Entrenador/") ? "trainer" : "client";
    window.FLOW_BACKEND.requireUser().then(async current=>{
      const {data:profile}=await window.FLOW_BACKEND.client.from("profiles").select("role").eq("id",current.id).single();
      if(!profile || profile.role!==expected) window.location.replace("login.html");
    }).catch(()=>window.location.replace("login.html"));
  });
})();
