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
})();
