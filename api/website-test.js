const ALLOWED_REPOSITORIES = new Set(["Hamdan852/hamdan-ai"]);
function clean(v, max=200){return typeof v==='string'?v.trim().slice(0,max):'';}
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const repository=clean(req.body?.repository); const files=Array.isArray(req.body?.files)?req.body.files:[];
  if(!ALLOWED_REPOSITORIES.has(repository)) return res.status(403).json({error:'Repository is not approved.'});
  const required=['index.html','styles.css','app.js','README.md'];
  const paths=new Set(files.map(f=>clean(f?.path)));
  const missing=required.filter(x=>!paths.has(x));
  const contentErrors=files.filter(f=>!clean(f?.content,50000)).map(f=>clean(f?.path));
  const passed=missing.length===0&&contentErrors.length===0;
  return res.status(200).json({ok:passed,stage:'Test',repository,tests:{requiredFiles:missing.length===0,nonEmptyFiles:contentErrors.length===0},missing,contentErrors,checks:[{name:'Required project files',passed},{name:'Non-empty generated files',passed:contentErrors.length===0},{name:'Repository target approved',passed:true}],next:passed?['Deploy','Verify']:['Change','Test'],deploymentPerformed:false,message:passed?'Pre-deployment validation passed.':'Pre-deployment validation found issues; no deployment was attempted.'});
}
