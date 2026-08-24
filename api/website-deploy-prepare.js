const ALLOWED_REPOSITORIES = new Set(["Hamdan852/hamdan-ai"]);
function clean(v,max=200){return typeof v==='string'?v.trim().slice(0,max):'';}
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const repository=clean(req.body?.repository); const approved=req.body?.approved===true; const tests=req.body?.tests;
  if(!ALLOWED_REPOSITORIES.has(repository)) return res.status(403).json({error:'Repository is not approved.'});
  if(!approved) return res.status(403).json({error:'Explicit deployment approval is required.'});
  if(tests?.ok!==true) return res.status(409).json({error:'Deployment is blocked until the test stage passes.'});
  return res.status(200).json({ok:true,stage:'Deploy',repository,provider:'Vercel',deploymentStarted:false,liveUrl:null,verificationRequired:true,message:'Deployment is authorized and prepared, but no external deployment has been started by this endpoint. Connect an authenticated deployment worker to execute the provider operation.'});
}
