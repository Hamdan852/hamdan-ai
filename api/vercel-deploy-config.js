const clean=v=>typeof v==='string'?v.trim().slice(0,200):'';
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const configured=Boolean(process.env.VERCEL_TOKEN);
 const project=clean(process.env.VERCEL_PROJECT_NAME);
 const team=clean(process.env.VERCEL_TEAM_ID);
 return res.status(200).json({ok:true,provider:'Vercel',configured,projectConfigured:Boolean(project),teamConfigured:Boolean(team),credential:'server-side',next:configured&&project?['Build project','Run tests','Request explicit deployment approval','Create Vercel deployment','Verify deployment']:['Configure VERCEL_TOKEN and VERCEL_PROJECT_NAME in the server environment'],message:configured&&project?'Vercel deployment configuration is present.':'Vercel deployment is not fully configured. No deployment was attempted.'});
}
