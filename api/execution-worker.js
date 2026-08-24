const ALLOWED_REPOSITORIES=new Set(['Hamdan852/hamdan-ai']);
const ACTIONS=new Set(['build','test','deploy','verify']);
const clean=v=>typeof v==='string'?v.trim().slice(0,500):'';
const id=v=>clean(v,120).replace(/[^a-zA-Z0-9._:-]/g,'');
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const repository=clean(req.body?.repository),action=clean(req.body?.action),approved=req.body?.approved===true,requestId=id(req.body?.requestId)||`run_${Date.now().toString(36)}`;
 if(!ALLOWED_REPOSITORIES.has(repository))return res.status(403).json({error:'Repository is not approved.'});
 if(!ACTIONS.has(action))return res.status(400).json({error:'Unsupported worker action.'});
 if(action==='deploy'&&!approved)return res.status(403).json({error:'Explicit deployment approval is required.'});
 const now=new Date().toISOString();
 const commands={build:['install dependencies','run production build'],test:['run lint/type checks','run automated tests','run security checks'],deploy:['create deployment artifact','submit to authorized provider','capture deployment id'],verify:['check deployment status','probe critical routes','inspect runtime health']};
 return res.status(200).json({ok:true,requestId,repository,action,status:'queued',startedAt:now,steps:commands[action],execution:{externalWriteAllowed:action==='deploy'&&approved,credentials:'server-side-only',idempotencyKey:requestId,auditEvent:{action,repository,at:now}},message:'Execution request accepted. This endpoint queues the contract; an authenticated runtime worker must execute the listed operations and return provider-specific results.'});
}
