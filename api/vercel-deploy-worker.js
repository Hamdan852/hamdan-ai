const ALLOWED_REPOSITORIES=new Set(['Hamdan852/hamdan-ai']);
const clean=v=>typeof v==='string'?v.trim().slice(0,20000):'';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const token=process.env.VERCEL_TOKEN;
 const repository=clean(req.body?.repository),artifact=req.body?.artifact,target=clean(req.body?.target)||'preview';
 if(!token)return res.status(503).json({error:'Vercel deployment is not configured: VERCEL_TOKEN is missing on the server.'});
 if(!ALLOWED_REPOSITORIES.has(repository))return res.status(403).json({error:'Repository is not approved.'});
 if(!artifact?.id||!Array.isArray(artifact.files)||!artifact.files.length)return res.status(400).json({error:'A populated deployment artifact is required.'});
 if(!['preview','production'].includes(target))return res.status(400).json({error:'Deployment target must be preview or production.'});
 if(target==='production'&&req.body?.approved!==true)return res.status(403).json({error:'Explicit production approval is required.'});
 const files=artifact.files.map(f=>({file:clean(f.path),data:clean(f.content)}));
 const body={name:clean(req.body?.project)||artifact.projectName||'hamdan-project',target,files};
 try{const upstream=await fetch('https://api.vercel.com/v13/deployments',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await upstream.json().catch(()=>({}));if(!upstream.ok)return res.status(upstream.status).json({ok:false,error:data?.error?.message||'Vercel deployment request failed.',provider:'vercel'});return res.status(200).json({ok:true,provider:'vercel',deploymentId:data.id||null,url:data.url?`https://${data.url}`:null,state:data.readyState||'QUEUED',target,artifactId:artifact.id,verificationRequired:true,message:'Vercel accepted the artifact deployment. Verify the deployment before declaring it live.'});}catch(error){return res.status(502).json({ok:false,error:'Unable to reach Vercel.',detail:error.message});}
}
