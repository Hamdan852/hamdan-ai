const CAPABILITIES=[
 ['Discovery','Requirements, acceptance criteria, user journeys and project scoping'],
 ['Design','Responsive UI, accessibility, design systems, components, themes and motion'],
 ['Engineering','Frontend, backend, APIs, databases, authentication, integrations and AI features'],
 ['AI','Agents, chat, RAG, structured generation, automation, voice, image, audio and video workflows'],
 ['Quality','Unit/integration checks, build validation, security review, performance and browser verification'],
 ['Delivery','GitHub changes, preview environments, production deployment, domain setup and rollback planning'],
 ['Operations','Logs, health checks, incident diagnosis, regression analysis and maintenance'],
 ['Marketplace','Company intake, service matching, proposals, milestones, approvals, delivery and support']
];
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 res.status(200).json({ok:true,product:'Hamdan Developer',version:'foundation',principles:['Understand before changing','Small reviewable changes','Approval before material actions','Test before deploy','Verify after deploy','Secrets remain server-side'],capabilities:CAPABILITIES,workflow:['Understand','Inspect','Plan','Approve','Change','Test','Deploy','Verify','Operate']});
}
