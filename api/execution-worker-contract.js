const ACTIONS=new Set(['build','test','deploy','verify']);
const ALLOWED_REPOSITORIES=new Set(['Hamdan852/hamdan-ai']);
const clean=v=>typeof v==='string'?v.trim().slice(0,500):'';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const repository=clean(req.body?.repository), action=clean(req.body?.action), approved=req.body?.approved===true;
 if(!ALLOWED_REPOSITORIES.has(repository))return res.status(403).json({error:'Repository is not approved.'});
 if(!ACTIONS.has(action))return res.status(400).json({error:'Unsupported worker action.'});
 if((action==='deploy')&&!approved)return res.status(403).json({error:'Explicit deployment approval is required.'});
 return res.status(200).json({ok:true,contract:{version:'1',repository,action,approved,credentialPolicy:'server-side-only',idempotencyRequired:true,timeoutRequired:true,auditRequired:true},status:'ready',executionStarted:false,message:'Execution worker contract accepted. An authenticated worker must perform the external operation.'});
}
