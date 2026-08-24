(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const repository = "Hamdan852/hamdan-ai";
  const WEBSITE_KEY = "hamdan.websites";

  function websites(){try{return JSON.parse(localStorage.getItem(WEBSITE_KEY)||"[]");}catch{return[];}}
  function saveWebsites(items){localStorage.setItem(WEBSITE_KEY,JSON.stringify(items));window.dispatchEvent(new StorageEvent("storage",{key:WEBSITE_KEY}));}
  function createWebsite(){
    const input=$("#websiteName");
    const name=(input?.value||"").trim();
    if(!name){input?.focus();return;}
    const project={id:`site-${Date.now()}`,name,status:"Draft",createdAt:new Date().toISOString(),description:"Website created with Hamdan Developer",repository};
    const items=websites();items.unshift(project);saveWebsites(items);input.value="";renderWebsiteProjects();
    const notice=$("#websiteCreated");if(notice){notice.hidden=false;notice.textContent=`✓ ${name} created. It is saved as a Hamdan website project.`;}
  }
  function renderWebsiteProjects(){const box=$("#websiteProjects");if(!box)return;const items=websites();box.innerHTML=items.length?items.map(p=>`<div class="website-project"><div><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.status)} · ${new Date(p.createdAt).toLocaleDateString()}</small></div><button type="button" data-open-project="${escapeHtml(p.id)}">Open</button></div>`).join(""):'<div class="empty-panel">No websites yet. Create your first website above.</div>';$$('[data-open-project]').forEach(btn=>btn.addEventListener('click',()=>{const p=websites().find(x=>x.id===btn.dataset.openProject);if(p)window.location.href=`/developer.html?project=${encodeURIComponent(p.id)}`;}));}

  $$(".nav").forEach(button => button.addEventListener("click", () => {const view=button.dataset.view;$$('.nav').forEach(b=>b.classList.toggle('active',b===button));$$('.view').forEach(v=>v.classList.toggle('active',v.id===view));window.scrollTo({top:0,behavior:'smooth'});}));
  $$(".quick-prompts button").forEach(button=>button.addEventListener("click",()=>{$("#developerPrompt").value=button.dataset.prompt;$("#developerPrompt").focus();}));
  $("#createWebsite")?.addEventListener("click",createWebsite);
  $("#websiteName")?.addEventListener("keydown",e=>{if(e.key==="Enter")createWebsite();});
  renderWebsiteProjects();

  async function postJson(path,body){const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json",accept:"application/json"},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`${path} failed`);return data;}
  function fallback(prompt){return{title:"Initial engineering assessment",summary:"The request was understood, but live repository inspection was unavailable. No change is proposed without evidence.",action:"Retry inspection before planning or changing code.",risk:"Low — planning only",areas:["Project context","Architecture","Verification"],stage:"Inspect",workflow:["Understand","Inspect","Plan","Approve","Change","Test","Deploy","Verify"],inspection:{repository,readOnly:true}};}
  $("#askDeveloper").addEventListener("click",async()=>{const prompt=$("#developerPrompt").value.trim();if(!prompt){$("#developerPrompt").focus();return;}const result=$("#developerResult");result.hidden=false;result.innerHTML='<h3>Inspecting the project…</h3><p>Hamdan Developer is following its controlled engineering workflow.</p>';try{const assessment=await postJson("/api/developer",{prompt});const inspection=await postJson("/api/project-inspect",{repository,ref:"main"});const plan=await postJson("/api/project-plan",{repository,prompt,inspection:{...inspection.summary,files:inspection.files,repository:inspection.repository,readOnly:inspection.scope?.readOnly}});renderResult({...assessment,stage:"Plan",inspection:{repository,readOnly:true},plan});}catch(error){renderResult({...fallback(prompt),action:`${fallback(prompt).action} (${error.message})`});}});
  function renderResult(data){const result=$("#developerResult");const workflow=(data.workflow||[]).map((item,index)=>`<span class="workflow-step ${item===data.stage?"current":index<(data.workflow||[]).indexOf(data.stage)?"done":""}">${index+1}. ${escapeHtml(item)}</span>`).join("");const plan=data.plan;const priorities=plan?.plan?.priorities||[];const evidence=plan?.evidence;result.innerHTML=`<h3>${escapeHtml(data.title||"Engineering plan")}</h3><p>${escapeHtml(plan?.plan?.objective||data.summary||"No plan generated.")}</p><div class="workflow-track">${workflow}</div><div class="result-grid"><div><b>Current stage</b><span>${escapeHtml(data.stage||"Inspect")}</span></div><div><b>Risk level</b><span>${escapeHtml(data.risk||"Planning only")}</span></div><div><b>Repository evidence</b><span>${evidence?`${evidence.inspectedFiles} files inspected · ${evidence.truncated?"truncated":"complete"}`:"Read-only inspection"}</span></div><div><b>Approval</b><span>${plan?.plan?.approvalRequired===false?"Not required":"Required before code changes"}</span></div></div>${priorities.length?`<div class="plan-priorities"><b>Plan priorities</b>${priorities.map(item=>`<div><strong>${escapeHtml(item.priority)} · ${escapeHtml(item.area)}</strong><span>${escapeHtml(item.reason)}</span></div>`).join("")}</div>`:""}<div class="inspection-note">Read-only inspection · No code changes · No deployment</div>`;}
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
})();