const clean=v=>typeof v==='string'?v.trim().slice(0,16000):'';
const rules=[
 {key:'AI Website Development',base:1800,days:5},
 {key:'AI Chatbot / Support Agent',base:2200,days:7},
 {key:'WhatsApp Automation',base:1400,days:5},
 {key:'Voice AI Agent',base:2600,days:8},
 {key:'AI Video Production',base:1200,days:4},
 {key:'Business Automation',base:2400,days:8},
 {key:'AI Software / API Integration',base:3000,days:10}
];
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const brief=clean(req.body?.brief), services=Array.isArray(req.body?.services)?req.body.services.map(clean).filter(Boolean):[];
 if(!brief)return res.status(400).json({error:'Project brief is required.'});
 const selected=rules.filter(r=>services.includes(r.key));
 const items=selected.length?selected:[{key:'Custom AI Solution',base:2500,days:10}];
 const subtotal=items.reduce((n,x)=>n+x.base,0); const timeline=Math.max(...items.map(x=>x.days));
 const milestones=[{name:'Discovery & architecture',share:15},{name:'Development',share:45},{name:'Testing & security',share:20},{name:'Client review & launch',share:20}];
 return res.status(200).json({ok:true,stage:'Proposal',proposal:{id:`proposal_${Date.now().toString(36)}`,currency:'USD',estimatedPrice:{min:Math.round(subtotal*.9),max:Math.round(subtotal*1.25)},estimatedDays:timeline,services:items.map(x=>x.key),milestones:milestones.map(m=>({...m,estimatedAmount:Math.round(subtotal*m.share/100)})),scope:{brief,assumptions:['Final integrations and third-party fees may change the estimate.','Production deployment requires approved credentials and infrastructure.','Human specialist involvement may be added for requirements outside Hamdan capabilities.']},status:'Draft'},approvalRequired:true,message:'Draft proposal generated for client review. No contract, payment, code change, or deployment has been created.'});
}
