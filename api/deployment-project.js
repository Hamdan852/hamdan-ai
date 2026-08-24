const ALLOWED_REPOSITORY='Hamdan852/hamdan-ai';
const clean=v=>typeof v==='string'?v.trim().slice(0,500):'';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const repository=clean(req.body?.repository), projectId=clean(req.body?.projectId), projectName=clean(req.body?.projectName);
 if(repository!==ALLOWED_REPOSITORY)return res.status(403).json({error:'Repository is not approved.'});
 if(!projectId||!projectName)return res.status(400).json({error:'Project ID and project name are required.'});
 const slug=projectName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'hamdan-project';
 return res.status(200).json({ok:true,manifest:{projectId,projectName,slug,repository,source:'hamdan-developer',environment:'preview',deploymentApprovalRequired:true,verificationRequired:true,artifactPolicy:'generated-project-only'},message:'Project deployment manifest prepared. No files were uploaded and no deployment was started.'});
}
