const REPO='Hamdan852/hamdan-ai';
const clean=v=>typeof v==='string'?v.trim().slice(0,500):'';
const safePath=v=>clean(v).replace(/^\/+|\.\./g,'');
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const repository=clean(req.body?.repository),projectId=clean(req.body?.projectId),projectName=clean(req.body?.projectName),files=Array.isArray(req.body?.files)?req.body.files:[];
 if(repository!==REPO)return res.status(403).json({error:'Repository is not approved.'});
 if(!projectId||!projectName)return res.status(400).json({error:'Project ID and project name are required.'});
 const artifactFiles=files.map(f=>({path:safePath(f?.path),purpose:clean(f?.purpose)})).filter(f=>f.path);
 if(!artifactFiles.length)return res.status(400).json({error:'No generated project files were supplied.'});
 const artifactId=`artifact_${projectId}_${Date.now().toString(36)}`;
 return res.status(200).json({ok:true,artifact:{id:artifactId,projectId,projectName,repository,files:artifactFiles,source:'hamdan-developer',environment:'preview',ready:false,checksumRequired:true,verificationRequired:true},message:'Deployment artifact manifest created. File contents were not uploaded or deployed by this endpoint.'});
}
