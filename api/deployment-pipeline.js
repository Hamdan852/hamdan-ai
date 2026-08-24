const REPO='Hamdan852/hamdan-ai';
const clean=v=>typeof v==='string'?v.trim().slice(0,500):'';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const repository=clean(req.body?.repository),projectId=clean(req.body?.projectId),projectName=clean(req.body?.projectName),artifactId=clean(req.body?.artifactId),environment=clean(req.body?.environment)||'preview',approved=req.body?.approved===true;
 if(repository!==REPO)return res.status(403).json({error:'Repository is not approved.'});
 if(!projectId||!projectName||!artifactId)return res.status(400).json({error:'Project, project name and artifact are required.'});
 if(!['preview','production'].includes(environment))return res.status(400).json({error:'Invalid deployment environment.'});
 if(environment==='production'&&!approved)return res.status(403).json({error:'Explicit production approval is required.'});
 return res.status(200).json({ok:true,status:'ready',deployment:{id:`deployment_${projectId}_${Date.now().toString(36)}`,projectId,projectName,artifactId,repository,environment,approved,verificationRequired:true},message:'Deployment request is ready for the authorized deployment provider. No external deployment was started by this endpoint.'});
}
