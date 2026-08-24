const REPO='Hamdan852/hamdan-ai';
const clean=v=>typeof v==='string'?v.trim().slice(0,20000):'';
const safePath=v=>clean(v,500).replace(/^\/+|\.\./g,'');
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const repository=clean(req.body?.repository,200),project=req.body?.project,approved=req.body?.approved===true,files=Array.isArray(req.body?.files)?req.body.files:[];
 if(repository!==REPO)return res.status(403).json({error:'Repository is not approved.'});
 if(!approved)return res.status(403).json({error:'Explicit approval is required before creating a deployable artifact.'});
 if(!project?.id||!project?.name)return res.status(400).json({error:'A valid project is required.'});
 const artifactFiles=files.map(f=>({path:safePath(f?.path),purpose:clean(f?.purpose,500),content:clean(f?.content)})).filter(f=>f.path&&f.content);
 if(!artifactFiles.length)return res.status(400).json({error:'Generated file contents are required.'});
 const artifactId=`artifact_${project.id}_${Date.now().toString(36)}`;
 return res.status(200).json({ok:true,stage:'Change',artifact:{id:artifactId,projectId:project.id,projectName:project.name,repository,files:artifactFiles.map(({path,purpose})=>({path,purpose})),fileCount:artifactFiles.length,source:'hamdan-developer',environment:'preview',ready:true,checksumRequired:true,verificationRequired:true},payload:artifactFiles,message:'Generated website files are now represented by a deployable artifact payload. No repository write or external deployment was performed.'});
}
