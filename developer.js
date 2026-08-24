(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const repository = "Hamdan852/hamdan-ai";
  const WEBSITE_KEY = "hamdan.websites";

  function websites(){try{return JSON.parse(localStorage.getItem(WEBSITE_KEY)||"[]");}catch{return[];}}
  function saveWebsites(items){localStorage.setItem(WEBSITE_KEY,JSON.stringify(items));window.dispatchEvent(new StorageEvent("storage",{key:WEBSITE_KEY}));}
  async function postJson(path,body){const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json",accept:"application/json"},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`${path} failed`);return data;}
  async function createWebsite(){
    const input=$("#websiteName");
    const brief=$("#websiteBrief");
    const type=$("#websiteType");
    const name=(input?.value||"").trim();
    const description=(brief?.value||"").trim();
    if(!name){input?.focus();return;}
    if(!description){brief?.focus();return;}
    const result=$("#developerResult");
    if(result){result.hidden=false;result.innerHTML='<h3>Planning your website…</h3><p>Hamdan Developer is preparing the project structure. No files are being changed yet.</p>';}
    try {
      const plan=await postJson("/api/website-create",{repository,name,brief:description,type:type?.value||"Custom"});
      const project={...plan.project,status:"Planned",createdAt:new Date().toISOString(),files:plan.files,approvalRequired:plan.approvalRequired};
      const items=websites().filter(p=>p.id!==project.id);items.unshift(project);saveWebsites(items);renderWebsiteProjects();
      if(result) renderWebsitePlan(plan);
      const notice=$("#websiteCreated");if(notice){notice.hidden=false;notice.textContent=`✓ ${name} planned. Review the plan before generating files.`;}
    } catch(error) {
      if(result){result.hidden=false;result.innerHTML=`<h3>Website planning failed</h3><p>${escapeHtml(error.message)}</p>`;}
    }
  }
  function renderWebsiteProjects(){const box=$("#websiteProjects");if(!box)return;const items=websites();box.innerHTML=items.length?items.map(p=>`<div class="website-project"><div><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.status||"Draft")} · ${new Date(p.createdAt).toLocaleDateString()}</small></div><button type="button" data-open-project="${escapeHtml(p.id)}">Open</button></div>`).join(""):'<div class="empty-panel">No websites yet. Create your first website above.</div>';$$('[data-open-project]').forEach(btn=>btn.addEventListener('click',()=>{const p=websites().find(x=>x.id===btn.dataset.openProject);if(p)window.location.href=`/developer.html?project=${encodeURIComponent(p.id)}`;}));}
  function renderWebsitePlan(data){const result=$("#developerResult");if(!result)return;const workflow=(data.workflow||[]).map((item,index)=>`<span class="workflow-step ${item===data.stage?"current":index<2?"done":""}">${index+1}. ${escapeHtml(item)}</span>`).join("");const files=(data.files||[]).map(file=>`<div><strong>${escapeHtml(file.path)}</strong><span>${escapeHtml(file.purpose)}</span></div>`).join("");result.hidden=false;result.innerHTML=`<h3>Website plan ready</h3><p>${escapeHtml(data.message||"Review this plan before any files are generated.")}</p><div class="workflow-track">${workflow}</div><div class="result-grid"><div><b>Project</b><span>${escapeHtml(data.project?.name||"")}</span></div><div><b>Type</b><span>${escapeHtml(data.project?.type||"Custom")}</span></div><div><b>Approval</b><span>Required</span></div><div><b>Writes</b><span>None yet</span></div></div><div class="plan-priorities"><b>Initial project files</b>${files}</div><div class="inspection-note">Planning only · No code changes · No deployment</div>`;}

  $$(".nav").forEach(button => button.addEventListener("click", () => {const view=button.dataset.view;$$('.nav').forEach(b=>b.classList.toggle('active',b===button));$$('.view').forEach(v=>v.classList.toggle('active',v.id===view));window.scrollTo({top:0,behavior:'smooth'});}));
  $$(".quick-prompts button").forEach(button=>button.addEventListener("click",()=>{$("#developerPrompt").value=button.dataset.prompt;$("#developerPrompt").focus();}));
  $("#createWebsite")?.addEventListener("click",createWebsite);
  $("#websiteName")?.addEventListener("keydown",e=>{if(e.key==="Enter")createWebsite();});
  renderWebsiteProjects();

  function fallback(prompt){return{title:"Initial engineering assessment",summary:"The request was understood, but live repository inspection was unavailable. No change is proposed without evidence.",action:"Retry inspection before planning or changing code.",risk:"Low — planning only",areas:["Project context","Architecture","Verification"],stage:"Inspect",workflow:["Understand","Inspect","Plan","Approve","Change","Test","Deploy","Verify"],inspection:{repository,readOnly:true}};}
  $("#askDeveloper").addEventListener("click",async()=>{const prompt=$("#developerPrompt").value.trim();if(!prompt){$("#developerPrompt").focus();return;}const result=$("#developerResult");result.hidden=false;result.innerHTML='<h3>Inspecting the project…</h3><p>Hamdan Developer is following its controlled engineering workflow.</p>';try{const assessment=await postJson("/api/developer",{prompt});const inspection=await postJson("/api/project-inspect",{repository,ref:"main"});const plan=await postJson("/api/project-plan",{repository,prompt,inspection:{...inspection.summary,files:inspection.files,repository:inspection.repository,readOnly:inspection.scope?.readOnly}});renderResult({...assessment,stage:"Plan",inspection:{repository,readOnly:true},plan});}catch(error){renderResult({...fallback(prompt),action:`${fallback(prompt).action} (${error.message})`});}});
  function renderResult(data){const result=$("#developerResult");const workflow=(data.workflow||[]).map((item,index)=>`<span class="workflow-step ${item===data.stage?"current":index<(data.workflow||[]).indexOf(data.stage)?"done":""}">${index+1}. ${escapeHtml(item)}</span>`).join("");const plan=data.plan;const priorities=plan?.plan?.priorities||[];const evidence=plan?.evidence;result.innerHTML=`<h3>${escapeHtml(data.title||"Engineering plan")}</h3><p>${escapeHtml(plan?.plan?.objective||data.summary||"No plan generated.")}</p><div class="workflow-track">${workflow}</div><div class="result-grid"><div><b>Current stage</b><span>${escapeHtml(data.stage||"Inspect")}</span></div><div><b>Risk level</b><span>${escapeHtml(data.risk||"Planning only")}</span></div><div><b>Repository evidence</b><span>${evidence?`${evidence.inspectedFiles} files inspected · ${evidence.truncated?"truncated":"complete"}`:"Read-only inspection"}</span></div><div><b>Approval</b><span>${plan?.plan?.approvalRequired===false?"Not required":"Required before code changes"}</span></div></div>${priorities.length?`<div class="plan-priorities"><b>Plan priorities</b>${priorities.map(item=>`<div><strong>${escapeHtml(item.priority)} · ${escapeHtml(item.area)}</strong><span>${escapeHtml(item.reason)}</span></div>`).join("")}</div>`:""}<div class="inspection-note">Read-only inspection · No code changes · No deployment</div>`;}
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
})();
