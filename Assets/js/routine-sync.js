(function(){
  const getApi=()=>window.FLOW_BACKEND;
  async function user(){const api=getApi();if(!api?.ready)return null;try{return await api.requireUser();}catch{return null;}}
  const number=value=>{if(value===null||value===undefined||value===""||value==="Sin peso")return null;const n=Number(String(value).replace(",","."));return Number.isFinite(n)?n:null;};
  window.FLOW_ROUTINE_SYNC={
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
    async listForClient(clientId){const api=getApi();if(!api?.ready||!clientId)return null;const {data,error}=await api.client.from("routines").select("id,name,day_name,warmup_steps,notes,created_at,routine_exercises(id,exercise_id,exercise_name,muscle_group,sets,reps,weight,rest_seconds,position,notes)").eq("client_id",clientId).order("created_at",{ascending:false});if(error)throw error;return data||[];},
    async recordProgress({clientId,routineExerciseId,exerciseName,weight,repetitions,notes}){const api=getApi(),current=await user();if(!api?.ready||!current||!clientId)return {synced:false};const {error}=await api.client.from("progress_logs").insert({client_id:clientId,routine_exercise_id:routineExerciseId||null,exercise_name:exerciseName,weight:number(weight),repetitions:parseInt(repetitions,10)||null,notes:notes||null});if(error)throw error;return {synced:true};},
    async listProgress(clientId){const api=getApi();if(!api?.ready||!clientId)return null;const {data,error}=await api.client.from("progress_logs").select("id,exercise_name,weight,repetitions,notes,recorded_at,routine_exercise_id").eq("client_id",clientId).order("recorded_at",{ascending:false}).limit(50);if(error)throw error;return data||[];}
  };
})();
