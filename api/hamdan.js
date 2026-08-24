const REPO='Hamdan852/hamdan-ai';
const clean=v=>typeof v==='string'?v.trim().slice(0,20000):'';
const json=(res,status,data)=>res.status(status).json(data);
const allowed=repository=>repository===REPO;
const config=()=>({configured:Boolean(process.env.VERCEL_TOKEN&&process.env.VERCEL_PROJECT_NAME),required:['VERCEL_TOKEN','VERCEL_PROJECT_NAME']});
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 const op=clean(req.body?.op);
 const repository=clean(req.body?.repository);
 if(repository&&!allowed(repository))return json(res,403,{error:'Repository is not approved.'});
 if(op==='deployment-config'||op==='vercel-readiness')return json(res,200,{ok:true,...config(),provider:'vercel'});
 if(op==='artifact'){if(req.body?.approved!==true)return json(res,403,{error:'Explicit approval is required.'});const project=req.body?.project,files=Array.isArray(req.body?.files)?req.body.files:[];if(!project?.id||!project?.name||!files.length)return json(res,400,{error:'Project and generated files are required.'});return json(res,200,{ok:true,stage:'Change',artifact:{id:`artifact_${project.id}_${Date.now().toString(36)}`,projectId:project.id,projectName:project.name,repository:REPO,files:files.map(f=>({path:clean(f.path),purpose:clean(f.purpose),content:clean(f.content)})).filter(f=>f.path&&f.content),environment:'preview',ready:true,verificationRequired:true}});}
 if(op==='deployment-request'){const artifact=req.body?.artifact,target=clean(req.body?.target)||'preview';if(!artifact?.id||!artifact.files?.length)return json(res,400,{error:'A populated deployment artifact is required.'});if(!['preview','production'].includes(target))return json(res,400,{error:'Invalid deployment target.'});if(target==='production'&&req.body?.approved!==true)return json(res,403,{error:'Explicit production approval is required.'});if(!config().configured)return json(res,503,{error:'Vercel deployment is not configured.',required:config().required});const upstream=await fetch('https://api.vercel.com/v13/deployments',{method:'POST',headers:{Authorization:`Bearer ${process.env.VERCEL_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({name:clean(req.body?.project)||artifact.projectName||'hamdan-project',target,files:artifact.files.map(f=>({file:clean(f.path),data:clean(f.content)}))})});const data=await upstream.json().catch(()=>({}));if(!upstream.ok)return json(res,upstream.status,{ok:false,error:data?.error?.message||'Vercel deployment request failed.',provider:'vercel'});return json(res,200,{ok:true,provider:'vercel',deploymentId:data.id||null,url:data.url?`https://${data.url}`:null,state:data.readyState||'QUEUED',verificationRequired:true});}
 return json(res,400,{error:'Unknown Hamdan API operation.'});
}
