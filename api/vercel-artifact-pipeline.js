const REPO='Hamdan852/hamdan-ai';
const clean=v=>typeof v==='string'?v.trim().slice(0,20000):'';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const repository=clean(req.body?.repository),artifact=req.body?.artifact,approved=req.body?.approved===true;
 if(repository!==REPO)return res.status(403).json({error:'Repository is not approved.'});
 if(!approved)return res.status(403).json({error:'Explicit deployment approval is required.'});
 if(!artifact?.id||!artifact?.projectId||!Array.isArray(artifact?.files)||!artifact.files.length)return res.status(400).json({error:'A populated deployment artifact is required.'});
 const environment=clean(req.body?.environment)||'preview';
 if(!['preview','production'].includes(environment))return res.status(400).json({error:'Invalid deployment environment.'});
 if(environment==='production'&&req.body?.productionApproved!==true)return res.status(403).json({error:'Explicit production approval is required.'});
 const configured=Boolean(process.env.VERCEL_TOKEN&&process.env.VERCEL_PROJECT_NAME);
 if(!configured)return res.status(503).json({error:'Vercel deployment is not configured.',required:['VERCEL_TOKEN','VERCEL_PROJECT_NAME']});
 return res.status(200).json({ok:true,status:'ready-for-worker',provider:'vercel',deployment:{projectId:artifact.projectId,projectName:artifact.projectName,artifactId:artifact.id,environment,fileCount:artifact.files.length,verificationRequired:true},message:'Validated artifact for the authenticated Vercel worker. No external deployment was started by this endpoint.'});
}
