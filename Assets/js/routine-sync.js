(function(){
  const getApi=()=>window.FLOW_BACKEND;
  async function user(){const api=getApi();if(!api?.ready)return null;try{return await api.requireUser();}catch{return null;}}
  const number=value=>{if(value===null||value===undefined||value===""||value==="Sin peso")return null;const n=Number(String(value).replace(",","."));return Number.isFinite(n)?n:null;};
  window.FLOW_ROUTINE_SYNC={
    async saveIndependentRoutine({name,day,exercise,sets,reps,restSeconds,warmupSteps}){
      const api=getApi(),owner=await user();
      if(!api?.ready||!owner)return {synced:false};
      const {data:routine,error}=await api.client.from("routines").insert({owner_id:owner.id,client_id:owner.id,trainer_id:null,name:name||"Rutina independiente",day_name:day||"Día sin definir",warmup_steps:Array.isArray(warmupSteps)?warmupSteps:[],notes:null}).select("id").single();
      if(error)throw error;
      const {error:exerciseError}=await api.client.from("routine_exercises").insert({routine_id:routine.id,exercise_id:`independent-${Date.now()}`,exercise_name:exercise||"Ejercicio",sets:Math.max(1,parseInt(sets,10)||3),reps:String(reps||"12"),rest_seconds:number(restSeconds),position:0});
      if(exerciseError)throw exerciseError;
      return {synced:true,routineId:routine.id};
    },
    async migrateLocalRoutines({items,markerKey}){
      const api=getApi(),owner=await user();
      if(!api?.ready||!owner||!Array.isArray(items)||!items.length)return {synced:false,reason:"session"};
      const pendientes=items.filter((_,index)=>!JSON.parse(localStorage.getItem(markerKey)||"[]").includes(index));
      const migrados=JSON.parse(localStorage.getItem(markerKey)||"[]");
      for(const [index,rutina] of items.entries()){
        if(!pendientes.includes(rutina)||migrados.includes(index))continue;
        await this.saveIndependentRoutine({name:rutina.nombreSemana||"Rutina independiente",day:rutina.dia,exercise:rutina.ejercicio,sets:rutina.series,reps:rutina.repeticiones,restSeconds:rutina.descanso,warmupSteps:String(rutina.calentamiento||"").split(/\n+/).map(paso=>paso.trim()).filter(Boolean)});
        migrados.push(index);localStorage.setItem(markerKey,JSON.stringify(migrados));
      }
      return {synced:true,count:migrados.length};
    },
    async saveAssignment({clientId,name,blocks}){
      const api=getApi(),trainer=await user();if(!api?.ready||!trainer||!clientId)return {synced:false};
      const grouped=blocks.reduce((out,b)=>{(out[b.dia||"Día sin definir"]||=[]).push(b);return out;},{}),saved=[];
      for(const [day,items] of Object.entries(grouped)){
        const first=items[0]||{};
        const {data:routine,error}=await api.client.from("routines").insert({trainer_id:trainer.id,client_id:clientId,name:name||"Rutina personalizada",day_name:day,warmup_steps:first.calentamiento||[],notes:first.observaciones||null}).select("id").single();
        if(error)throw error;
        const rows=items.map((b,i)=>({routine_id:routine.id,exercise_id:String(b.ejercicioId||b.id||`exercise-${i}`),exercise_name:b.ejercicio?.nombre||b.ejercicio||"Ejercicio",muscle_group:b.grupoMuscular||b.grupo||null,sets:Math.max(1,parseInt(b.series,10)||3),reps:String(b.repeticiones||"12"),weight:number(b.peso),rest_seconds:number(String(b.descanso||"").match(/\d+/)?.[0]),position:i,notes:b.observaciones||b.indicacion||null}));
        const result=await api.client.from("routine_exercises").insert(rows);if(result.error)throw result.error;saved.push(routine.id);
      }
      return {synced:true,saved};
    },
    async deleteIndependentBlock(name){const api=getApi(),owner=await user();if(!api?.ready||!owner||!name)return {synced:false};const {error}=await api.client.from("routines").delete().eq("owner_id",owner.id).eq("client_id",owner.id).eq("name",name);if(error)throw error;return {synced:true};},
    async deleteIndependentDay(name,day){const api=getApi(),owner=await user();if(!api?.ready||!owner||!name||!day)return {synced:false};const {error}=await api.client.from("routines").delete().eq("owner_id",owner.id).eq("client_id",owner.id).eq("name",name).eq("day_name",day);if(error)throw error;return {synced:true};},
    async listForClient(clientId){const api=getApi(),current=await user();if(!api?.ready||!current||!clientId||clientId!==current.id)return null;const {data,error}=await api.client.from("routines").select("id,name,day_name,warmup_steps,notes,created_at,routine_exercises(id,exercise_id,exercise_name,muscle_group,sets,reps,weight,rest_seconds,position,notes)").eq("client_id",current.id).order("created_at",{ascending:false});if(error)throw error;return data||[];},
    async recordProgress({clientId,routineExerciseId,exerciseName,weight,repetitions,setsCompleted,notes}){const api=getApi(),current=await user();if(!api?.ready||!current||!clientId||clientId!==current.id)return {synced:false};const {error}=await api.client.from("progress_logs").insert({client_id:clientId,routine_exercise_id:routineExerciseId||null,exercise_name:exerciseName,weight:number(weight),sets_completed:parseInt(setsCompleted,10)||null,repetitions:parseInt(repetitions,10)||null,notes:notes||null});if(error)throw error;return {synced:true};},
    async listProgress(clientId){const api=getApi(),current=await user();if(!api?.ready||!current||!clientId||clientId!==current.id)return null;const {data,error}=await api.client.from("progress_logs").select("id,exercise_name,weight,sets_completed,repetitions,notes,recorded_at,routine_exercise_id").eq("client_id",clientId).order("recorded_at",{ascending:false}).limit(50);if(error)throw error;return data||[];}
  };
})();
