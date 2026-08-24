const REPO='Hamdan852/hamdan-ai';
const clean=v=>typeof v==='string'?v.trim().slice(0,500):'';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const repository=clean(req.body?.repository),projectId=clean(req.body?.projectId),projectName=clean(req.body?.projectName),artifactId=clean(req.body?.artifactId),environment=clean(req.body?.environment)||'preview';
 if(repository!==REPO)return res.status(403).json({error:'Repository is not approved.'});
 if(!projectId||!projectName||!artifactId)return res.status(400).json({error:'Project, project name and artifact are required.'});
 if(!['preview','production'].includes(environment))return res.status(400).json({error:'Invalid deployment environment.'});
 const configured=Boolean(process.env.VERCEL_TOKEN&&process.env.VERCEL_PROJECT_NAME);
 res.status(200).json({ok:true,configured,provider:'vercel',project:{projectId,projectName,artifactId,repository},environment,ready:configured,message:configured?'Artifact-backed Vercel deployment is ready for an authorized worker.':'Configure VERCEL_TOKEN and VERCEL_PROJECT_NAME on the server before deployment.',required:configured?[]:['VERCEL_TOKEN','VERCEL_PROJECT_NAME']});
}
