const ALLOWED_REPOSITORIES=new Set(['Hamdan852/hamdan-ai']);
const clean=v=>typeof v==='string'?v.trim().slice(0,20000):'';
const stages=['Understand','Inspect','Plan','Approve','Change','Test','Deploy','Verify'];
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const repository=clean(req.body?.repository,200), action=clean(req.body?.action,40), approved=req.body?.approved===true;
 if(!ALLOWED_REPOSITORIES.has(repository))return res.status(403).json({error:'Repository is not approved.'});
 if(!['plan','generate','test','deploy-prepare','verify'].includes(action))return res.status(400).json({error:'Unsupported workflow action.'});
 if(['generate','deploy-prepare'].includes(action)&&!approved)return res.status(403).json({error:'Explicit approval is required for this action.'});
 const stage={plan:'Plan',generate:'Change',test:'Test','deploy-prepare':'Deploy',verify:'Verify'}[action];
 return res.status(200).json({ok:true,stage,repository,action,workflow:stages,execution:{started:true,externalWrites:false,deploymentStarted:false,verificationRequired:stage==='Deploy'},message:action==='verify'?'Verification stage prepared.':'Workflow stage prepared. Connect an authorized worker to perform external code, test, or deployment operations.'});
}
