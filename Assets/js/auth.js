(function(){
  function backend(){ return window.FLOW_BACKEND || null; }

  async function profileFor(user){
    const api=backend();
    if(!api?.ready){ throw new Error("Backend no configurado."); }
    const {data,error}=await api.client.from("profiles").select("id,full_name,role,age,goal,weight_kg,height_cm,emergency_contact_name,emergency_contact_phone").eq("id",user.id).single();
    if(error) throw error;
    return data;
  }

  window.FLOW_AUTH={
    async signIn(email,password,expectedRole){
      const api=backend();
      if(!api?.ready) throw new Error("Supabase no está disponible. Revisa la configuración del backend.");
      const {data,error}=await api.client.auth.signInWithPassword({email,password});
      if(error) throw error;
      const profile=await profileFor(data.user);
      if(expectedRole && profile.role !== expectedRole){
        await api.client.auth.signOut();
        sessionStorage.removeItem("flowAuthRole");
        sessionStorage.removeItem("flowAuthProfile");
        throw new Error(expectedRole === "trainer" ? "Este correo pertenece a un atleta. Usa el acceso de cliente." : "Este correo pertenece a un entrenador. Usa el acceso de entrenador.");
      }
      sessionStorage.setItem("flowAuthRole",profile.role);
      sessionStorage.setItem("flowAuthProfile",JSON.stringify(profile));
      return profile;
    },
    async resetPassword(email){
      const api=backend();
      if(!api?.ready) throw new Error("Supabase no está disponible.");
      const redirect=`${window.location.origin}${window.location.pathname}?reset=1`;
      const {error}=await api.client.auth.resetPasswordForEmail(email,{redirectTo:redirect});
      if(error) throw error;
    },
    async updatePassword(password){
      const api=backend();
      if(!api?.ready) throw new Error("Supabase no está disponible.");
      const {error}=await api.client.auth.updateUser({password});
      if(error) throw error;
    },
    destination(role){
      return role === "client" ? "dashboard.html" : "../Entrenador/dashboard.html";
    }
  };
})();
