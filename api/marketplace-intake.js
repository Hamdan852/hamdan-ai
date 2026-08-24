const SERVICE_RULES=[
 {keys:['website','web app','landing page','frontend'],service:'AI Website Development',model:'Hamdan AI + Developer'},
 {keys:['chatbot','customer support','support agent'],service:'AI Chatbot / Support Agent',model:'Hamdan AI + Developer'},
 {keys:['whatsapp','messages','messaging automation'],service:'WhatsApp Automation',model:'Hybrid'},
 {keys:['voice','phone','call agent'],service:'Voice AI Agent',model:'Hamdan AI + Developer'},
 {keys:['video','avatar','video generator'],service:'AI Video Production',model:'Hamdan AI'},
 {keys:['automation','workflow','crm'],service:'Business Automation',model:'Hybrid'},
 {keys:['api','integration','saas','software'],service:'AI Software / API Integration',model:'Hamdan AI + Developer'},
];
const clean=v=>typeof v==='string'?v.trim().slice(0,16000):'';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const brief=clean(req.body?.brief); if(!brief)return res.status(400).json({error:'Project brief is required.'});
 const lower=brief.toLowerCase(); const matches=SERVICE_RULES.filter(r=>r.keys.some(k=>lower.includes(k)));
 const services=(matches.length?matches:SERVICE_RULES.slice(-1)).map(r=>r.service);
 const models=[...new Set((matches.length?matches:SERVICE_RULES.slice(-1)).map(r=>r.model))];
 return res.status(200).json({ok:true,stage:'Scope',project:{id:`request_${Date.now().toString(36)}`,brief,status:'Analyzed'},recommendation:{services,executionModels:models,workflow:['Requirement','Scope','Proposal','Approval','Development','Testing','Client Review','Delivery','Support'],questions:['What is the target market or country?','What deadline and budget range should be used?','Which integrations or accounts are required?','Who approves the final delivery?']},message:'Project analyzed. No contract, payment, code change, or deployment has been created.'});
}
