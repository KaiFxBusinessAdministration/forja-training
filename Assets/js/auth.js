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
      let profile;
      try{profile=await profileFor(data.user);}catch(error){
        if(expectedRole!=="client") throw error;
        const fullName=data.user.user_metadata?.full_name||data.user.user_metadata?.name||data.user.email?.split("@")[0]||"Atleta";
        const {data:created,error:creationError}=await api.client.from("profiles").insert({id:data.user.id,full_name:fullName,role:"client"}).select("id,full_name,role,age,goal,weight_kg,height_cm,emergency_contact_name,emergency_contact_phone").single();
        if(creationError) throw creationError; profile=created;
      }
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
    async register({email,password,fullName,role,invite}){
      const api=backend();
      if(!api?.ready) throw new Error("Supabase no está disponible.");
      const requestedRole=role === "trainer" && invite === "FORJA-TRAINER" ? "trainer" : "client";
      const {data,error}=await api.client.auth.signUp({email,password,options:{data:{full_name:fullName,requested_role:requestedRole}}});
      if(error) throw error;
      if(data.user && data.session){
        const {error:profileError}=await api.client.from("profiles").insert({id:data.user.id,full_name:fullName,role:requestedRole});
        if(profileError) throw profileError;
      }
      return {needsConfirmation:!data.session,role:requestedRole};
    },
    async signInWithProvider(provider,expectedRole){
      const api=backend();
      if(!api?.ready) throw new Error("Supabase no está disponible.");
      sessionStorage.setItem("flowOAuthExpectedRole",expectedRole);
      const {error}=await api.client.auth.signInWithOAuth({provider,options:{redirectTo:`${window.location.origin}${window.location.pathname}?oauth=1`}});
      if(error) throw error;
    },
    async finishOAuth(expectedRole){
      const api=backend();
      const {data,error}=await api.client.auth.getSession();
      if(error||!data.session) throw new Error("No se pudo iniciar la sesión.");
      let profile;
      try{profile=await profileFor(data.session.user);}catch(error){
        if(expectedRole!=="client") throw error;
        const fullName=data.session.user.user_metadata?.full_name||data.session.user.user_metadata?.name||data.session.user.email?.split("@")[0]||"Atleta";
        const {data:created,error:creationError}=await api.client.from("profiles").insert({id:data.session.user.id,full_name:fullName,role:"client"}).select("id,full_name,role,age,goal,weight_kg,height_cm,emergency_contact_name,emergency_contact_phone").single();
        if(creationError) throw creationError; profile=created;
      }
      if(profile.role!==expectedRole){await api.client.auth.signOut();throw new Error("El rol de esta cuenta no corresponde a este acceso.");}
      sessionStorage.setItem("flowAuthRole",profile.role);sessionStorage.setItem("flowAuthProfile",JSON.stringify(profile));return profile;
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
