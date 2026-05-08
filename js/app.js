
function toggleMobileMenu(force){
 const sidebar=document.getElementById('sidebar');
 const backdrop=document.getElementById('mobileBackdrop');
 if(!sidebar||!backdrop) return;
 const shouldOpen = typeof force === 'boolean' ? force : !sidebar.classList.contains('open');
 sidebar.classList.toggle('open', shouldOpen);
 backdrop.classList.toggle('show', shouldOpen);
}

const SECURITY_LIMITS={maxText:120,maxLongText:600};
function escapeHTML(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
function cleanText(value,max=SECURITY_LIMITS.maxText){return String(value??'').replace(/[<>]/g,'').trim().slice(0,max);}
function cleanEmail(value){return cleanText(value,160).toLowerCase();}
function isValidEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);}
function securePercent(value){return Math.max(0,Math.min(100,Number(value)||0));}
function sanitizeDatabase(){
 db.alunos=(db.alunos||[]).map(a=>({...a,nome:cleanText(a.nome),email:cleanEmail(a.email),plano:cleanText(a.plano),professor:cleanText(a.professor),status:cleanText(a.status),treino:cleanText(a.treino),genero:cleanText(a.genero)||'masculino'}));
 db.planos=(db.planos||[]).map(p=>({...p,nome:cleanText(p.nome),valor:Number(p.valor)||0,duracao:cleanText(p.duracao)}));
 db.pagamentos=(db.pagamentos||[]).map(p=>({...p,aluno:cleanText(p.aluno),valor:Number(p.valor)||0,status:cleanText(p.status),venc:cleanText(p.venc,20)}));
 db.frequencia=(db.frequencia||[]).map(f=>({...f,aluno:cleanText(f.aluno),entrada:cleanText(f.entrada,20),saida:cleanText(f.saida,20)}));
 db.treinos=(db.treinos||[]).map(t=>({...t,aluno:cleanText(t.aluno),grupo:cleanText(t.grupo),exercicios:cleanText(t.exercicios,SECURITY_LIMITS.maxLongText)}));

 db.tickets=(db.tickets||[]).map(t=>({...t,nome:cleanText(t.nome),email:cleanEmail(t.email||''),status:cleanText(t.status||'Aberto'),prioridade:cleanText(t.prioridade||'Normal'),assunto:cleanText(t.assunto||'Suporte'),data:cleanText(t.data||''),mensagens:(t.mensagens||[]).map(m=>({autor:cleanText(m.autor),texto:cleanText(m.texto,SECURITY_LIMITS.maxLongText),hora:cleanText(m.hora||'')}))}));}

const users=[
 {email:'admin@nexusfit.com',senha:'123',nome:'Angello Admin',role:'Administrador'},
 {email:'recepcao@nexusfit.com',senha:'123',nome:'Recepção Nexus',role:'Recepcionista'},
 {email:'professor@nexusfit.com',senha:'123',nome:'Prof. Gabriel',role:'Professor'}
];
const seed={
 alunos:[],personais:[],
 planos:[{id:1,nome:'Básico',valor:89,duracao:'30 dias'},{id:2,nome:'Performance',valor:139,duracao:'30 dias'},{id:3,nome:'Elite',valor:199,duracao:'30 dias'}],
 pagamentos:[],
 frequencia:[],
 treinos:[]
,
 nutricoes:[],
 tickets:[]
};
let db;try{db=JSON.parse(localStorage.getItem('nexus_final_com_suporte_estavel')||'null')||seed}catch(e){db=seed}let current=null;let editing={};sanitizeDatabase();

function ensurePersonais(){
 if(!db.personais) db.personais=[];
 if(!db.nutricoes) db.nutricoes=[];
 db.personais=db.personais.map(p=>({...p,nutricaoAutorizada:!!p.nutricaoAutorizada}));
}


function ensureSupportData(){
 if(typeof db !== 'undefined' && db){
  if(!db.tickets) db.tickets=[];
 }
}

function save(){sanitizeDatabase();localStorage.setItem('nexus_final_com_suporte_estavel',JSON.stringify(db))}
function nextId(arr){return arr.length?Math.max(...arr.map(x=>Number(x.id)||0))+1:1}
function money(n){return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function today(){return new Date().toISOString().slice(0,10)}
loginForm.onsubmit=e=>{e.preventDefault();const loginEmail=cleanEmail(email.value);const loginSenha=String(senha.value||'').trim();if(!isValidEmail(loginEmail))return alert('Digite um e-mail válido.');let u=users.find(x=>x.email===loginEmail&&x.senha===loginSenha);if(!u){const aluno=db.alunos.find(a=>cleanEmail(a.email)===loginEmail&&String(a.senha||'123')===loginSenha);if(aluno)u={email:aluno.email,senha:aluno.senha||'123',nome:aluno.nome,role:'Aluno',alunoId:aluno.id}}if(!u)return alert('Login inválido. Para aluno cadastrado, use o e-mail do cadastro e a senha padrão 123.');current=u;loginPage.classList.add('hidden');app.classList.remove('hidden');userName.textContent=u.nome;roleBadge.textContent=u.role;buildMenu();route('dashboard')}
function logout(){current=null;app.classList.add('hidden');loginPage.classList.remove('hidden')}
function allowed(){
 if(current.role==='Aluno')return ['dashboard','nutricao','meutreino'];
 if(current.role==='Professor')return canProfessorUseNutrition()?['dashboard','alunos','treinos','nutricaoprof']:['dashboard','alunos','treinos'];
 if(current.role==='Recepcionista')return ['dashboard','alunos','frequencia','pagamentos','tickets'];
 return ['dashboard','alunos','personais','planos','pagamentos','frequencia','treinos','tickets'];
}
const labels={dashboard:'Dashboard',alunos:'Alunos',personais:'Personal',planos:'Planos',pagamentos:'Pagamentos',frequencia:'Frequência',treinos:'Treinos',meutreino:'Meu treino',nutricao:'Nutrição',nutricaoprof:'Nutrição',
 tickets:'Tickets'};
function buildMenu(){menu.innerHTML=allowed().map(k=>`<button class='nav-btn' onclick="route('${k}')">${labels[k]||k}</button>`).join('')}
function route(page){
 ensurePersonais();
 if(!current)return logout();
 if(!allowed().includes(page))page='dashboard';
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.textContent==labels[page]));
 pageTitle.textContent=labels[page]||'Dashboard';
 content.innerHTML=(views[page]||views.dashboard)();
}
function studentOptions(sel=''){return db.alunos.map(a=>`<option ${a.nome===sel?'selected':''}>${a.nome}</option>`).join('')}
function planOptions(sel=''){return db.planos.map(p=>`<option ${p.nome===sel?'selected':''}>${p.nome}</option>`).join('')}
function statCards(){let receita=db.pagamentos.filter(p=>p.status==='Pago').reduce((s,p)=>s+Number(p.valor),0);return `<div class='grid cards'><div class='card'><h3>Alunos ativos</h3><strong>${db.alunos.length}</strong><span class='muted'>matriculados</span></div><div class='card'><h3>Receita paga</h3><strong>${money(receita)}</strong><span class='paid'>confirmada</span></div><div class='card'><h3>Check-ins hoje</h3><strong>${db.frequencia.length}</strong><span class='muted'>entradas</span></div><div class='card'><h3>Pendências</h3><strong>${db.pagamentos.filter(p=>p.status!=='Pago').length}</strong><span class='late'>financeiro</span></div></div>`}
function professorStats(){let alunos=db.alunos.filter(a=>a.professor===current.nome);let nomes=alunos.map(a=>a.nome);let presentes=db.frequencia.filter(f=>nomes.includes(f.aluno)&&f.saida==='--').length;let treinos=db.treinos.filter(t=>nomes.includes(t.aluno)).length;let grupos=[...new Set(db.treinos.filter(t=>nomes.includes(t.aluno)).map(t=>t.grupo))].length;return `<div class='grid cards'><div class='card'><h3>Alunos acompanhados</h3><strong>${alunos.length}</strong><span class='muted'>sob sua orientação</span></div><div class='card'><h3>Na academia agora</h3><strong>${presentes}</strong><span class='paid'>treinando</span></div><div class='card'><h3>Treinos montados</h3><strong>${treinos}</strong><span class='muted'>planos de treino</span></div><div class='card'><h3>Grupos ativos</h3><strong>${grupos}</strong><span class='muted'>musculares</span></div></div>`}
function chartBox(){let total=db.pagamentos.length||1, pagos=db.pagamentos.filter(p=>p.status==='Pago').length, pend=db.pagamentos.filter(p=>p.status==='Pendente').length, atraso=db.pagamentos.filter(p=>p.status==='Atrasado').length;let bars=[['Pagos',pagos,'paid'],['Pendentes',pend,'warn'],['Atrasados',atraso,'late'],['Check-ins',db.frequencia.length,'paid']];return `<div class='card'><h2>Leitura rápida da operação</h2><div class='metric-bars'>${bars.map(b=>`<div><span>${b[0]} <b class='${b[2]}'>${b[1]}</b></span><i><em style='width:${Math.min(100,(b[1]/Math.max(total,db.frequencia.length,1))*100)}%'></em></i></div>`).join('')}</div><p class='muted'>O gráfico mostra quantidades reais cadastradas no sistema.</p></div>`}
function professorChart(){let alunos=db.alunos.filter(a=>a.professor===current.nome).map(a=>a.nome);let treinos=db.treinos.filter(t=>alunos.includes(t.aluno));let grupos=['Peito','Costas','Ombro','Bíceps','Tríceps','Antebraço','Abdômen','Perna Superior','Perna Inferior'];let max=Math.max(...grupos.map(g=>treinos.filter(t=>t.grupo===g).length),1);return `<div class='card'><h2>Distribuição dos treinos</h2><div class='metric-bars'>${grupos.map(g=>{let qtd=treinos.filter(t=>t.grupo===g).length;return `<div><span>${g} <b class='paid'>${qtd}</b></span><i><em style='width:${Math.min(100,(qtd/max)*100)}%'></em></i></div>`}).join('')}</div><p class='muted'>Mostra quantos alunos acompanhados têm treino em cada grupo muscular.</p></div>`}
const views={
 dashboard(){if(current.role==='Aluno')return alunoDashboardView();let prof=current.role==='Professor';let alunos=prof?db.alunos.filter(a=>a.professor===current.nome):db.alunos;if(prof)return `${professorStats()}<div class='grid layout-2' style='margin-top:18px'><div class='table-wrap'><h2>Alunos que você acompanha</h2><table><tr><th>Aluno</th><th>Treino</th><th>Status</th><th>Presença</th></tr>${alunos.map(a=>{let f=db.frequencia.find(x=>x.aluno===a.nome&&x.saida==='--');return `<tr><td>${a.nome}<br><small class='muted'>${a.email||''}</small></td><td>${a.treino}</td><td><span class='paid'>${a.status}</span></td><td><span class='tag'>${f?'Na academia':'Fora'}</span></td></tr>`}).join('')}</table></div>${professorChart()}</div>`;return `${statCards()}<div class='grid layout-2' style='margin-top:18px'><div class='table-wrap'><h2>Operação em tempo real</h2><table><tr><th>Aluno</th><th>Plano</th><th>Treino</th><th>Professor</th></tr>${alunos.map(a=>`<tr><td>${a.nome}</td><td><span class='tag'>${a.plano}</span></td><td>${a.treino}</td><td>${a.professor}</td></tr>`).join('')}</table></div>${chartBox()}</div>`},
 alunos(){let prof=current.role==='Professor';let arr=prof?db.alunos.filter(a=>a.professor===current.nome):db.alunos;if(prof)return `<div class='notice'>Professor visualiza apenas alunos vinculados ao seu acompanhamento. Nenhuma informação financeira ou de plano aparece aqui.</div><div class='table-wrap' style='margin-top:18px'><table><tr><th>Nome</th><th>Treino</th><th>Status</th><th>Presença</th></tr>${arr.map(a=>{let f=db.frequencia.find(x=>x.aluno===a.nome&&x.saida==='--');return `<tr><td>${a.nome}<br><small class='muted'>${a.email||''}</small></td><td>${a.treino}</td><td><span class='paid'>${a.status}</span></td><td><span class='tag'>${f?'Na academia':'Fora'}</span></td></tr>`}).join('')}</table></div>`;return `<div class='notice'>Cadastre, edite e exclua alunos.</div>${formAluno()}<div class='table-wrap' style='margin-top:18px'><table><tr><th>Nome</th><th>Gênero</th><th>Plano</th><th>Professor</th><th>Status</th><th>Ações</th></tr>${arr.map(a=>`<tr><td>${a.nome}<br><small class='muted'>${a.email||''}</small></td><td>${a.genero==='feminino'?'Feminino':'Masculino'}</td><td>${a.plano}</td><td>${a.professor||'<span class="muted">Sem personal</span>'}</td><td><span class='paid'>${a.status}</span></td><td><button class='mini' onclick='editAluno(${a.id})'>Editar</button><button class='mini danger' onclick='del("alunos",${a.id},"alunos")'>Excluir</button></td></tr>`).join('')}</table></div>`},
 personais(){return pagePersonais()},
 planos(){return `${formPlano()}<div class='table-wrap'><table><tr><th>Plano</th><th>Valor</th><th>Duração</th><th>Ações</th></tr>${db.planos.map(p=>`<tr><td>${p.nome}</td><td>${money(p.valor)}</td><td>${p.duracao}</td><td><button class='mini' onclick='editPlano(${p.id})'>Editar</button><button class='mini danger' onclick='del("planos",${p.id},"planos")'>Excluir</button></td></tr>`).join('')}</table></div>`},
 pagamentos(){return `${formPagamento()}<div class='table-wrap'><table><tr><th>Aluno</th><th>Valor</th><th>Status</th><th>Vencimento</th><th>Ações</th></tr>${db.pagamentos.map(p=>`<tr><td>${p.aluno}</td><td>${money(p.valor)}</td><td class='${p.status==='Pago'?'paid':p.status==='Atrasado'?'late':'warn'}'>${p.status}</td><td>${p.venc}</td><td><button class='mini' onclick='marcarPago(${p.id})'>Pago</button><button class='mini' onclick='editPagamento(${p.id})'>Editar</button><button class='mini danger' onclick='del("pagamentos",${p.id},"pagamentos")'>Excluir</button></td></tr>`).join('')}</table></div>`},
 frequencia(){return `${formFrequencia()}<div class='table-wrap'><table><tr><th>Aluno</th><th>Entrada</th><th>Saída</th><th>Status</th><th>Ações</th></tr>${db.frequencia.map(f=>`<tr><td>${f.aluno}</td><td>${f.entrada}</td><td>${f.saida}</td><td><span class='tag'>${f.saida==='--'?'Treinando':'Finalizado'}</span></td><td><button class='mini' onclick='saida(${f.id})'>Registrar saída</button><button class='mini danger' onclick='del("frequencia",${f.id},"frequencia")'>Excluir</button></td></tr>`).join('')}</table></div>`},
 treinos(){let prof=current.role==='Professor';let alunosPermitidos=prof?db.alunos.filter(a=>a.professor===current.nome).map(a=>a.nome):db.alunos.map(a=>a.nome);let arr=db.treinos.filter(t=>alunosPermitidos.includes(t.aluno));return `${formTreino(alunosPermitidos)}<div class='table-wrap'><table><tr><th>Aluno</th><th>Grupo muscular</th><th>Exercícios</th><th>Ações</th></tr>${arr.map(t=>`<tr><td>${t.aluno}</td><td>${t.grupo}</td><td>${t.exercicios}</td><td><button class='mini' onclick='editTreino(${t.id})'>Editar</button><button class='mini danger' onclick='del("treinos",${t.id},"treinos")'>Excluir</button></td></tr>`).join('')}</table></div>`},
 meutreino(){return alunoView()},
 nutricao(){return pageNutricao()},
 nutricaoprof(){return pageNutriProfessor()},
 tickets(){return pageTickets()}
};

function hasPersonal(plano){
 return String(plano||'').toLowerCase() !== 'básico' && String(plano||'').toLowerCase() !== 'basico';
}
function toggleProfessorField(){
 const plano=document.getElementById('alunoPlano');
 const prof=document.getElementById('alunoProf');
 if(!plano||!prof)return;
 const show=hasPersonal(plano.value);
 prof.style.display=show?'block':'none';
 prof.required=show;
 if(!show)prof.value='';
}

function formAluno(){let e=editing.aluno||{};let genero=e.genero||'masculino';let plano=e.plano||'Básico';let showProf=hasPersonal(plano);return `<form class='form-panel' onsubmit='saveAluno(event)'>
<input type='hidden' id='alunoId' value='${e.id||''}'>
<input class='input' id='alunoNome' placeholder='Nome' value='${e.nome||''}' required>
<input class='input' id='alunoEmail' placeholder='E-mail' value='${e.email||''}' required>
<select id='alunoGenero'>
 <option value='masculino' ${genero==='masculino'?'selected':''}>Masculino</option>
 <option value='feminino' ${genero==='feminino'?'selected':''}>Feminino</option>
</select>
<select id='alunoPlano' onchange='toggleProfessorField()'>${planOptions(plano)}</select>
<select id='alunoProf' style='display:${showProf?'block':'none'}'>${personalOptions(e.professor||'')}</select>
<button>${e.id?'Salvar edição':'Adicionar aluno'}</button>
</form>`}
function formPlano(){let e=editing.plano||{};return `<form class='form-panel' onsubmit='savePlano(event)'><input type='hidden' id='planoId' value='${e.id||''}'><input class='input' id='planoNome' placeholder='Nome do plano' value='${e.nome||''}' required><input class='input' id='planoValor' type='number' placeholder='Valor' value='${e.valor||''}' required><input class='input' id='planoDuracao' placeholder='Duração' value='${e.duracao||'30 dias'}'><button>${e.id?'Salvar edição':'Adicionar plano'}</button></form>`}
function formPagamento(){let e=editing.pagamento||{};return `<form class='form-panel' onsubmit='savePagamento(event)'><input type='hidden' id='pagamentoId' value='${e.id||''}'><select id='pagAluno'>${studentOptions(e.aluno)}</select><input class='input' id='pagValor' type='number' placeholder='Valor' value='${e.valor||''}' required><select id='pagStatus'><option ${e.status==='Pago'?'selected':''}>Pago</option><option ${e.status==='Pendente'?'selected':''}>Pendente</option><option ${e.status==='Atrasado'?'selected':''}>Atrasado</option></select><input class='input' id='pagVenc' type='date' value='${e.venc||today()}'><button>${e.id?'Salvar edição':'Registrar pagamento'}</button></form>`}
function formFrequencia(){return `<form class='form-panel' onsubmit='saveFreq(event)'><select id='freqAluno'>${studentOptions()}</select><input class='input' id='freqEntrada' type='time' required><button>Registrar entrada</button></form>`}
function formTreino(permitidos){let e=editing.treino||{};return `<form class='form-panel treino-form' onsubmit='saveTreino(event)'><input type='hidden' id='treinoId' value='${e.id||''}'><select id='treinoAluno'>${permitidos.map(n=>`<option ${e.aluno===n?'selected':''}>${n}</option>`).join('')}</select><select id='treinoGrupo'>${['Peito','Perna','Costas','Braço'].map(x=>`<option ${e.grupo===x?'selected':''}>${x}</option>`)}</select><input class='input wide' id='treinoExerc' placeholder='Exercícios separados por vírgula' value='${e.exercicios||''}' required><button>${e.id?'Salvar treino':'Criar treino'}</button></form>`}
function saveAluno(ev){ev.preventDefault();let id=Number(alunoId.value);let nome=cleanText(alunoNome.value), emailAluno=cleanEmail(alunoEmail.value);if(!nome||!isValidEmail(emailAluno))return alert('Preencha nome e e-mail válido.');let planoAluno=cleanText(alunoPlano.value);let professorAluno=hasPersonal(planoAluno)?cleanText(alunoProf.value):'';if(hasPersonal(planoAluno)&&!db.personais.length)return alert('Cadastre ao menos um personal antes de vincular alunos Performance ou Elite.');if(hasPersonal(planoAluno)&&!professorAluno)return alert('Selecione um personal para planos com acompanhamento.');let anterior=id?db.alunos.find(x=>x.id===id):null;let obj={id:id||nextId(db.alunos),nome,email:emailAluno,genero:cleanText(alunoGenero.value)||'masculino',plano:planoAluno,professor:professorAluno,status:'ativo',treino:anterior?.treino||'A definir',senha:anterior?.senha||'123'};if(id){db.alunos=db.alunos.map(x=>x.id===id?obj:x)}else db.alunos.push(obj);editing.aluno=null;save();route('alunos')}
function savePlano(ev){ev.preventDefault();let id=Number(planoId.value);let nomePlano=cleanText(planoNome.value);let valorPlano=Math.max(0,Number(planoValor.value)||0);if(!nomePlano||valorPlano<=0)return alert('Informe um plano e valor válido.');let obj={id:id||nextId(db.planos),nome:nomePlano,valor:valorPlano,duracao:cleanText(planoDuracao.value)};if(id)db.planos=db.planos.map(x=>x.id===id?obj:x);else db.planos.push(obj);editing.plano=null;save();route('planos')}
function savePagamento(ev){ev.preventDefault();let id=Number(pagamentoId.value);let valorPag=Math.max(0,Number(pagValor.value)||0);if(valorPag<=0)return alert('Informe um valor válido.');let obj={id:id||nextId(db.pagamentos),aluno:cleanText(pagAluno.value),valor:valorPag,status:cleanText(pagStatus.value),venc:cleanText(pagVenc.value,20)};if(id)db.pagamentos=db.pagamentos.map(x=>x.id===id?obj:x);else db.pagamentos.push(obj);editing.pagamento=null;save();route('pagamentos')}
function saveFreq(ev){ev.preventDefault();db.frequencia.push({id:nextId(db.frequencia),aluno:cleanText(freqAluno.value),entrada:cleanText(freqEntrada.value,20),saida:'--'});save();route('frequencia')}
function saveTreino(ev){ev.preventDefault();let id=Number(treinoId.value);let exercicios=cleanText(treinoExerc.value,SECURITY_LIMITS.maxLongText);if(!exercicios)return alert('Informe os exercícios do treino.');let obj={id:id||nextId(db.treinos),aluno:cleanText(treinoAluno.value),grupo:cleanText(treinoGrupo.value),exercicios};if(id)db.treinos=db.treinos.map(x=>x.id===id?obj:x);else db.treinos.push(obj);let al=db.alunos.find(a=>a.nome===obj.aluno); if(al)al.treino=obj.grupo; editing.treino=null;save();route('treinos')}
function editAluno(id){editing.aluno=db.alunos.find(x=>x.id===id);route('alunos')}function editPlano(id){editing.plano=db.planos.find(x=>x.id===id);route('planos')}function editPagamento(id){editing.pagamento=db.pagamentos.find(x=>x.id===id);route('pagamentos')}function editTreino(id){editing.treino=db.treinos.find(x=>x.id===id);route('treinos')}
function del(key,id,page){if(confirm('Excluir este registro?')){db[key]=db[key].filter(x=>x.id!==id);save();route(page)}}
function marcarPago(id){let p=db.pagamentos.find(x=>x.id===id);if(p)p.status='Pago';save();route('pagamentos')}
function saida(id){let f=db.frequencia.find(x=>x.id===id);if(f)f.saida=new Date().toTimeString().slice(0,5);save();route('frequencia')}

function getCurrentAluno(){
 if(!current||current.role!=='Aluno')return null;
 return db.alunos.find(a=>a.id===current.alunoId)||db.alunos.find(a=>cleanEmail(a.email)===cleanEmail(current.email))||null;
}

function daysUntil(dateStr){
 const todayDate=new Date();
 const due=new Date(dateStr+'T00:00:00');
 todayDate.setHours(0,0,0,0);
 return Math.ceil((due-todayDate)/(1000*60*60*24));
}
function alunoDashboardView(){
 let aluno=getCurrentAluno();
 if(!aluno)return `<div class='notice'>Aluno não encontrado. Cadastre o aluno pela recepção/administrador e acesse com o e-mail cadastrado e senha 123.</div>`;
 let pagamento=db.pagamentos.find(p=>p.aluno===aluno.nome)||{status:'Não lançada',valor:0,venc:today()};
 let plano=db.planos.find(p=>p.nome===aluno.plano)||{nome:aluno.plano,valor:pagamento.valor,duracao:'30 dias'};
 let faltam=daysUntil(pagamento.venc);
 let statusClass=pagamento.status==='Pago'?'paid':pagamento.status==='Atrasado'?'late':'warn';
 let vencimentoTexto=faltam>0?`vence em ${faltam} dias`:faltam===0?'vence hoje':`vencido há ${Math.abs(faltam)} dias`;
 let frequencias=db.frequencia.filter(f=>f.aluno===aluno.nome).length;
 return `<div class='grid cards'>
  <div class='card'><h3>Plano atual</h3><strong>${plano.nome}</strong><span class='paid'>${plano.duracao}</span></div>
  <div class='card'><h3>Mensalidade</h3><strong>${money(pagamento.valor||plano.valor)}</strong><span class='${statusClass}'>${pagamento.status}</span></div>
  <div class='card'><h3>Vencimento</h3><strong>${faltam>0?faltam:0} dias</strong><span class='${statusClass}'>${vencimentoTexto}</span></div>
  <div class='card'><h3>Check-ins</h3><strong>${frequencias}</strong><span class='muted'>registros recentes</span></div>
 </div>
 <div class='grid layout-2' style='margin-top:18px'>
  <div class='table-wrap'>
   <h2>Resumo da assinatura</h2>
   <table>
    <tr><th>Aluno</th><td>${aluno.nome}</td></tr>
    <tr><th>Plano contratado</th><td><span class='tag'>${plano.nome}</span></td></tr>
    <tr><th>Valor mensal</th><td>${money(pagamento.valor||plano.valor)}</td></tr>
    <tr><th>Status</th><td><span class='${statusClass}'>${pagamento.status}</span></td></tr>
    <tr><th>Próximo vencimento</th><td>${pagamento.venc} · ${vencimentoTexto}</td></tr>
   </table>
  </div>
  <div class='card'>
   <h2>Saúde da conta</h2>
   <div class='metric-bars'>
    <div><span>Plano ativo <b class='paid'>100%</b></span><i><em style='width:100%'></em></i></div>
    <div><span>Frequência semanal <b class='paid'>80%</b></span><i><em style='width:80%'></em></i></div>
    <div><span>Regularidade financeira <b class='${statusClass}'>${pagamento.status==='Pago'?'100%':pagamento.status==='Pendente'?'55%':'20%'}</b></span><i><em style='width:${pagamento.status==='Pago'?100:pagamento.status==='Pendente'?55:20}%'></em></i></div>
   </div>
   <p class='muted'>Use essa tela para o aluno acompanhar plano, vencimento e situação da assinatura. O treino continua separado em “Meu treino”.</p>
  </div>
 </div>`
}




function planoComNutricao(plano){
 const p=String(plano||'').toLowerCase();
 return p.includes('performance') || p.includes('elite');
}
function currentPersonalRecord(){
 ensurePersonais();
 return db.personais.find(p=>(p.email&&current.email&&p.email.toLowerCase()===current.email.toLowerCase()) || p.nome===current.nome);
}
function canProfessorUseNutrition(){
 if(!current || current.role!=='Professor')return false;
 const p=currentPersonalRecord();
 return !!(p && p.nutricaoAutorizada);
}
function premiumStudentOptions(selected=''){
 return db.alunos.filter(a=>planoComNutricao(a.plano)).map(a=>`<option value='${a.nome}' ${selected===a.nome?'selected':''}>${a.nome} · ${a.plano}</option>`).join('');
}

function personalOptions(selected=''){
 ensurePersonais();
 if(!db.personais.length){
  return `<option value=''>Nenhum personal cadastrado</option>`;
 }
 return `<option value=''>Selecione o personal</option>` + db.personais.map(p=>`<option value='${p.nome}' ${selected===p.nome?'selected':''}>${p.nome}</option>`).join('');
}
function pagePersonais(){
 ensurePersonais();
 return `<div class='notice'>Cadastre, edite e remova os profissionais. A autorização de nutrição libera a aba Nutrição para o professor especializado.</div>
 <form class='form-panel' onsubmit='savePersonal(event)'>
  <input type='hidden' id='personalId' value='${editing.personal?.id||''}'>
  <input class='input' id='personalNome' placeholder='Nome do personal' value='${editing.personal?.nome||''}' required>
  <input class='input' id='personalEmail' placeholder='E-mail profissional' value='${editing.personal?.email||''}'>
  <input class='input' id='personalEspecialidade' placeholder='Especialidade: hipertrofia, funcional, nutrição...' value='${editing.personal?.especialidade||''}'>
  <label class='check-line'><input type='checkbox' id='personalNutri' ${editing.personal?.nutricaoAutorizada?'checked':''}> Autorizar acesso à aba Nutrição</label>
  <button>${editing.personal?.id?'Salvar edição':'Adicionar personal'}</button>
 </form>
 <div class='table-wrap'><table><tr><th>Nome</th><th>E-mail</th><th>Especialidade</th><th>Nutrição</th><th>Ações</th></tr>
 ${db.personais.map(p=>`<tr><td>${p.nome}</td><td>${p.email||'<span class="muted">Não informado</span>'}</td><td>${p.especialidade||'<span class="muted">Geral</span>'}</td><td><span class='${p.nutricaoAutorizada?'paid':'warn'}'>${p.nutricaoAutorizada?'Autorizado':'Bloqueado'}</span></td><td><button class='mini' onclick='toggleNutriPersonal(${p.id})'>${p.nutricaoAutorizada?'Bloquear nutrição':'Autorizar nutrição'}</button><button class='mini' onclick='editPersonal(${p.id})'>Editar</button><button class='mini danger' onclick='deletePersonal(${p.id})'>Excluir</button></td></tr>`).join('') || `<tr><td colspan='5'><span class='muted'>Nenhum personal cadastrado ainda.</span></td></tr>`}
 </table></div>`;
}
function savePersonal(ev){
 ev.preventDefault(); ensurePersonais();
 let id=Number(personalId.value);
 let obj={id:id||nextId(db.personais),nome:cleanText(personalNome.value),email:cleanEmail(personalEmail.value||''),especialidade:cleanText(personalEspecialidade.value||'Geral'),nutricaoAutorizada:!!document.getElementById('personalNutri')?.checked};
 if(!obj.nome)return alert('Informe o nome do personal.');
 if(obj.email && !isValidEmail(obj.email))return alert('Informe um e-mail válido ou deixe em branco.');
 if(id){db.personais=db.personais.map(p=>p.id===id?obj:p)}else db.personais.push(obj);
 editing.personal=null; save(); route('personais');
}
function toggleNutriPersonal(id){
 ensurePersonais();
 db.personais=db.personais.map(p=>p.id===id?{...p,nutricaoAutorizada:!p.nutricaoAutorizada}:p);
 save(); route('personais');
}
function editPersonal(id){ensurePersonais(); editing.personal=db.personais.find(p=>p.id===id); route('personais')}
function deletePersonal(id){
 ensurePersonais();
 let p=db.personais.find(x=>x.id===id);
 if(!p)return;
 if(!confirm('Remover este personal? Alunos vinculados ficarão sem personal.'))return;
 db.personais=db.personais.filter(x=>x.id!==id);
 db.alunos=db.alunos.map(a=>a.professor===p.nome?{...a,professor:''}:a);
 save(); route('personais');
}
function nutritionSvg(){
 return `<svg class='nutrition-svg' viewBox='0 0 360 280'>
 <defs>
  <linearGradient id='waterFill' x1='0' x2='0' y1='1' y2='0'>
   <stop stop-color='#3dff72'/><stop offset='1' stop-color='#b6ff2e'/>
  </linearGradient>
  <filter id='nutriGlow'><feGaussianBlur stdDeviation='5' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>
 </defs>
 <rect x='10' y='10' width='340' height='260' rx='28' class='nutri-panel-svg'/>
 <g transform='translate(55,28)'>
  <circle cx='75' cy='36' r='26' class='nutri-body-base'/>
  <path d='M42 70 Q75 50 108 70 Q120 115 112 170 Q102 220 75 232 Q48 220 38 170 Q30 115 42 70Z' class='nutri-body-base'/>
  <path d='M42 142 Q75 120 112 142 L112 170 Q102 220 75 232 Q48 220 38 170Z' fill='url(#waterFill)' opacity='.86' filter='url(#nutriGlow)'/>
  <path d='M75 72 L75 230 M52 110 H98 M47 145 H105 M48 180 H102' class='nutri-lines'/>
 </g>
 <g transform='translate(185,54)'>
  <text x='0' y='0' class='nutri-title-svg'>Indicadores</text>
  <text x='0' y='42' class='nutri-big'>62%</text>
  <text x='0' y='66' class='nutri-small'>água corporal estimada</text>
  <text x='0' y='112' class='nutri-big'>1,78m</text>
  <text x='0' y='136' class='nutri-small'>altura cadastrada</text>
  <text x='0' y='182' class='nutri-big'>76kg</text>
  <text x='0' y='206' class='nutri-small'>peso de referência</text>
 </g>
 </svg>`;
}

function pageNutriProfessor(){
 if(!canProfessorUseNutrition()){
  return `<section class='nutrition-lock'><div class='lock-card'><div class='lock-icon'>🔒</div><span class='eyebrow'>Acesso restrito</span><h2>Aba Nutrição bloqueada para este professor.</h2><p class='muted'>Somente professores autorizados pela faculdade/administração podem criar dietas. Solicite liberação no painel administrativo, aba Personal.</p></div></section>`;
 }
 let edit=editing.nutricao||{};
 let opts=premiumStudentOptions(edit.aluno||'');
 return `<div class='notice'>Crie orientações nutricionais apenas para alunos dos planos Performance e Elite. Alunos do plano Básico não aparecem nesta lista.</div>
 <form class='form-panel nutri-form' onsubmit='saveNutricao(event)'>
  <input type='hidden' id='nutriId' value='${edit.id||''}'>
  <select id='nutriAluno' required>${opts||`<option value=''>Nenhum aluno Performance ou Elite cadastrado</option>`}</select>
  <input class='input' id='nutriObjetivo' placeholder='Objetivo nutricional' value='${edit.objetivo||''}' required>
  <textarea id='nutriDieta' placeholder='Ex: café da manhã, almoço, jantar, hidratação e observações...' required>${edit.dieta||''}</textarea>
  <button>${edit.id?'Salvar dieta':'Criar dieta'}</button>
 </form>
 <div class='table-wrap'><table><tr><th>Aluno</th><th>Objetivo</th><th>Responsável</th><th>Ações</th></tr>
 ${db.nutricoes.map(n=>`<tr><td>${n.aluno}</td><td>${n.objetivo}</td><td>${n.responsavel}</td><td><button class='mini' onclick='editNutricao(${n.id})'>Editar</button><button class='mini danger' onclick='delNutricao(${n.id})'>Excluir</button></td></tr>`).join('')||`<tr><td colspan='4'><span class='muted'>Nenhuma dieta cadastrada ainda.</span></td></tr>`}
 </table></div>`;
}
function saveNutricao(ev){
 ev.preventDefault(); ensurePersonais();
 let aluno=cleanText(nutriAluno.value);
 let a=db.alunos.find(x=>x.nome===aluno);
 if(!a || !planoComNutricao(a.plano))return alert('Selecione um aluno Performance ou Elite.');
 let id=Number(nutriId.value);
 let obj={id:id||nextId(db.nutricoes),aluno,objetivo:cleanText(nutriObjetivo.value),dieta:cleanText(nutriDieta.value),responsavel:current.nome,data:new Date().toLocaleDateString('pt-BR')};
 if(!obj.objetivo||!obj.dieta)return alert('Preencha objetivo e dieta.');
 if(id)db.nutricoes=db.nutricoes.map(n=>n.id===id?obj:n);else db.nutricoes.push(obj);
 editing.nutricao=null; save(); route('nutricaoprof');
}
function editNutricao(id){editing.nutricao=db.nutricoes.find(n=>n.id===id); route('nutricaoprof')}
function delNutricao(id){if(confirm('Excluir esta dieta?')){db.nutricoes=db.nutricoes.filter(n=>n.id!==id);save();route('nutricaoprof')}}

function pageNutricao(){
 let aluno=getCurrentAluno();
 if(!aluno)return `<div class='notice'>Aluno não encontrado.</div>`;
 let liberado=planoComNutricao(aluno.plano);
 if(!liberado){
  return `<section class='nutrition-lock'>
   <div class='lock-card'>
    <div class='lock-icon'>🔒</div>
    <span class='eyebrow'>Módulo premium</span>
    <h2>Nutrição inteligente disponível nos planos Performance e Elite.</h2>
    <p class='muted'>Seu plano atual é <b>${aluno.plano||'Básico'}</b>. Este módulo possui acompanhamento nutricional avançado e dietas criadas por profissional autorizado.</p>
    ${nutritionSvg()}
   </div>
  </section>`;
 }
 let dieta=db.nutricoes.find(n=>n.aluno===aluno.nome);
 return `<section class='student-hero'>
  <div class='muscle-card'>
   <span class='eyebrow'>Nutrição NexusFit</span>
   <h2>${dieta?dieta.objetivo:'Composição corporal'}</h2>
   ${nutritionSvg()}
   <p class='muted'>${dieta?`Dieta criada por ${dieta.responsavel} em ${dieta.data}.`:'Nenhuma dieta personalizada cadastrada ainda. O professor/nutricionista autorizado pode criar uma dieta para você.'}</p>
  </div>
  <div class='grid'>
   <div class='grid cards'>
    <div class='card'><h3>Água corporal</h3><strong>62%</strong><span class='paid'>ideal</span></div>
    <div class='card'><h3>Altura</h3><strong>1,78m</strong><span class='muted'>cadastro</span></div>
    <div class='card'><h3>Peso</h3><strong>76kg</strong><span class='paid'>em evolução</span></div>
    <div class='card'><h3>Plano</h3><strong>${aluno.plano}</strong><span class='paid'>liberado</span></div>
   </div>
   <div class='table-wrap'><h2>${dieta?'Dieta personalizada':'Orientações nutricionais'}</h2>
    <div class='workout-list'>
     ${dieta?dieta.dieta.split('\n').filter(Boolean).map((linha,i)=>`<div class='workout-item'><b>${String(i+1).padStart(2,'0')} · Orientação</b><p class='muted'>${linha}</p></div>`).join(''):`<div class='workout-item'><b>01 · Hidratação diária</b><p class='muted'>Meta sugerida: 2,8L de água por dia.</p></div><div class='workout-item'><b>02 · Proteína</b><p class='muted'>Priorizar fontes magras nas principais refeições.</p></div><div class='workout-item'><b>03 · Pré-treino</b><p class='muted'>Carboidrato leve 60 a 90 minutos antes do treino.</p></div><div class='workout-item'><b>04 · Pós-treino</b><p class='muted'>Refeição com proteína e carboidrato após o treino.</p></div>`}
    </div>
   </div>
  </div>
 </section>`;
}

let selectedMuscle='Peito';
let bodyView='front';
const muscleWorkouts={
 Peito:{objetivo:'Força e hipertrofia do peitoral',exercicios:['Supino reto','Supino inclinado','Crucifixo máquina','Flexão controlada']},
 Costas:{objetivo:'Expansão dorsal e resistência',exercicios:['Puxada alta','Remada curvada','Pulldown','Remada baixa']},
 Ombro:{objetivo:'Estabilidade, força e definição dos ombros',exercicios:['Desenvolvimento','Elevação lateral','Elevação frontal','Arnold press']},
 Bíceps:{objetivo:'Hipertrofia e força dos bíceps',exercicios:['Rosca direta','Rosca alternada','Rosca concentrada','Rosca banco scott']},
 Tríceps:{objetivo:'Potência e definição dos tríceps',exercicios:['Tríceps corda','Tríceps testa','Mergulho','Tríceps francês']},
 Antebraço:{objetivo:'Pegada, resistência e controle',exercicios:['Rosca punho','Farmer walk','Rosca inversa','Hand grip']},
 Abdômen:{objetivo:'Core, estabilidade e definição',exercicios:['Abdominal supra','Prancha isométrica','Elevação de pernas','Abdominal remador']},
 'Perna Superior':{objetivo:'Quadríceps, posterior e glúteos',exercicios:['Agachamento livre','Leg press','Cadeira extensora','Stiff']},
 'Perna Inferior':{objetivo:'Panturrilha, estabilidade e resistência',exercicios:['Panturrilha em pé','Panturrilha sentada','Saltos controlados','Gêmeos no leg press']}
};
function selectMuscle(grupo){selectedMuscle=grupo;if(grupo==='Costas'||grupo==='Tríceps')bodyView='back';route('meutreino')}
function setBodyView(view){bodyView=view;if(view==='front'&&selectedMuscle==='Costas')selectedMuscle='Peito';if(view==='back'&&selectedMuscle==='Peito')selectedMuscle='Costas';route('meutreino')}
function alunoView(){let aluno=getCurrentAluno(); if(!aluno)return `<div class='notice'>Aluno não encontrado. Cadastre o aluno pela recepção/administrador e acesse com o e-mail cadastrado e senha 123.</div>`;let treino=muscleWorkouts[selectedMuscle]||muscleWorkouts.Peito;let grupos=Object.keys(muscleWorkouts);return `<section class='student-hero'><div class='muscle-card'><div class='body-title'><div><span class='eyebrow'>Mapa muscular interativo</span><h2>${selectedMuscle}</h2></div><span class='pulse-dot'></span></div>${bodySvg(selectedMuscle, aluno.genero || 'masculino')}<div class='view-toggle'><button onclick=\"setBodyView('front')\" class='${bodyView==='front'?'active':''}'>Frente</button><button onclick=\"setBodyView('back')\" class='${bodyView==='back'?'active':''}'>Costas</button></div><div class='muscle-actions'>${grupos.map(g=>`<button onclick="selectMuscle('${g}')" class='${selectedMuscle===g?'active':''}'>${g}</button>`).join('')}</div><p class='muted'>Clique em uma região do boneco para destacar o grupo muscular e carregar o treino correspondente.</p></div><div class='grid'><div class='grid cards'><div class='card'><h3>Grupo selecionado</h3><strong>${selectedMuscle}</strong><span class='paid'>ativo</span></div><div class='card'><h3>Objetivo</h3><strong class='small-strong'>${treino.objetivo}</strong><span class='muted'>treino direcionado</span></div><div class='card'><h3>Exercícios</h3><strong>${treino.exercicios.length}</strong><span class='muted'>série sugerida</span></div><div class='card'><h3>Intensidade</h3><strong>Alta</strong><span class='paid'>performance</span></div></div><div class='table-wrap'><h2>Treino para ${selectedMuscle}</h2><div class='workout-list'>${treino.exercicios.map((e,i)=>`<div class='workout-item'><b>${String(i+1).padStart(2,'0')} · ${e}</b><p class='muted'>4 séries · 10 a 12 repetições · descanso 60s</p></div>`).join('')}</div></div></div></section>`}

function bodySvg(grupo,genero='masculino'){
 const view=bodyView||'front';
 const fem=genero==='feminino';
 const activeMap={
  Peito:['chest'],
  Costas:['back'],
  Ombro:['shoulderL','shoulderR'],
  Bíceps:['bicepsL','bicepsR'],
  Tríceps:['tricepsL','tricepsR'],
  Antebraço:['forearmL','forearmR'],
  Abdômen:['abs'],
  'Perna Superior':['thighL','thighR'],
  'Perna Inferior':['calfL','calfR']
 };
 const active=activeMap[grupo]||['chest'];
 const cls=id=>`nx-part ${active.includes(id)?'active':''}`;
 const label=`${view==='front'?'FRENTE':'COSTAS'} · ${fem?'FEMININO':'MASCULINO'}`;
 const head=fem?`<path class='nx-hair' d='M-32 28 Q-39-18 0-24 Q39-18 32 28 Q22 45 0 45 Q-22 45 -32 28Z'/><path class='nx-base' d='M-24 6 Q0-10 24 6 L23 50 Q12 70 0 74 Q-12 70 -23 50Z'/>`:`<path class='nx-base' d='M-28 3 Q0-18 28 3 L28 54 Q14 78 0 81 Q-14 78 -28 54Z'/>`;
 const torso=fem?
  `<path class='nx-base' d='M-58 102 Q0 73 58 102 Q85 152 77 236 Q65 305 42 352 Q20 372 0 374 Q-20 372 -42 352 Q-65 305 -77 236 Q-85 152 -58 102Z'/>`:
  `<path class='nx-base' d='M-78 103 Q0 67 78 103 Q108 151 96 236 Q82 308 52 356 Q26 378 0 381 Q-26 378 -52 356 Q-82 308 -96 236 Q-108 151 -78 103Z'/>`;
 const shoulderL=fem?`M-60 105 Q-98 88 -123 111 Q-142 130 -138 153 Q-108 161 -82 145Z`:`M-80 105 Q-119 82 -151 99 Q-181 115 -190 144 Q-170 168 -136 168 Q-101 158 -80 105Z`;
 const shoulderR=fem?`M60 105 Q98 88 123 111 Q142 130 138 153 Q108 161 82 145Z`:`M80 105 Q119 82 151 99 Q181 115 190 144 Q170 168 136 168 Q101 158 80 105Z`;
 const armL=fem?`M-130 154 Q-158 205 -148 272 Q-134 294 -112 276 Q-120 216 -100 165Z`:`M-178 164 Q-214 222 -201 292 Q-184 321 -156 298 Q-166 235 -139 172Z`;
 const armR=fem?`M130 154 Q158 205 148 272 Q134 294 112 276 Q120 216 100 165Z`:`M178 164 Q214 222 201 292 Q184 321 156 298 Q166 235 139 172Z`;
 const foreL=fem?`M-148 270 Q-157 329 -123 364 Q-101 350 -112 276Z`:`M-201 290 Q-211 345 -174 383 Q-148 369 -157 298Z`;
 const foreR=fem?`M148 270 Q157 329 123 364 Q101 350 112 276Z`:`M201 290 Q211 345 174 383 Q148 369 157 298Z`;
 const thighL=fem?`M-45 354 Q-22 375 -5 379 L-17 477 Q-38 499 -64 472 Q-59 408 -45 354Z`:`M-56 354 Q-27 380 -5 383 L-18 484 Q-44 508 -73 477 Q-69 412 -56 354Z`;
 const thighR=fem?`M45 354 Q22 375 5 379 L17 477 Q38 499 64 472 Q59 408 45 354Z`:`M56 354 Q27 380 5 383 L18 484 Q44 508 73 477 Q69 412 56 354Z`;
 const calfL=fem?`M-63 470 Q-38 490 -17 478 Q-18 536 -30 570 Q-54 586 -75 561 Q-74 514 -63 470Z`:`M-73 475 Q-45 495 -18 483 Q-19 539 -32 574 Q-59 590 -83 564 Q-82 517 -73 475Z`;
 const calfR=fem?`M63 470 Q38 490 17 478 Q18 536 30 570 Q54 586 75 561 Q74 514 63 470Z`:`M73 475 Q45 495 18 483 Q19 539 32 574 Q59 590 83 564 Q82 517 73 475Z`;
 const chest=fem?`M-72 112 Q-38 78 0 86 Q38 78 72 112 L62 174 Q31 195 0 195 Q-31 195 -62 174Z`:`M-90 116 Q-48 70 0 80 Q48 70 90 116 L78 187 Q37 211 0 211 Q-37 211 -78 187Z`;
 const abs=fem?`M-47 184 Q-23 202 0 204 Q23 202 47 184 L41 318 Q22 346 0 350 Q-22 346 -41 318Z`:`M-58 195 Q-29 215 0 217 Q29 215 58 195 L49 326 Q24 356 0 362 Q-24 356 -49 326Z`;
 const back=fem?`M-55 108 Q0 83 55 108 L74 174 Q40 210 25 263 L0 326 L-25 263 Q-40 210 -74 174Z`:`M-74 108 Q0 77 74 108 L90 174 Q53 214 33 271 L0 338 L-33 271 Q-53 214 -90 174Z`;
 return `<svg class='body-svg nx-anatomy' viewBox='0 0 430 620'>
 <defs>
  <linearGradient id='nxGreen' x1='0' x2='1'><stop stop-color='#caff35'/><stop offset='1' stop-color='#50ff79'/></linearGradient>
  <filter id='nxGlow'><feGaussianBlur stdDeviation='5' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>
 </defs>
 <rect x='8' y='8' width='414' height='604' rx='32' class='nx-panel'/>
 <text x='215' y='42' text-anchor='middle' class='nx-title'>${label}</text>
 <g transform='translate(215,70)' class='nx-model'>
  ${head}
  <path class='nx-base' d='M-20 74 L20 74 L28 104 L-28 104Z'/>
  ${torso}
  <path onclick="selectMuscle('Ombro')" class='${cls('shoulderL')}' d='${shoulderL}'/>
  <path onclick="selectMuscle('Ombro')" class='${cls('shoulderR')}' d='${shoulderR}'/>
  ${view==='front'
   ? `<path onclick="selectMuscle('Peito')" class='${cls('chest')}' d='${chest}'/><path class='nx-line' d='M0 85 L0 205 M-68 126 Q-32 148 0 153 Q32 148 68 126'/><path onclick="selectMuscle('Abdômen')" class='${cls('abs')}' d='${abs}'/><path class='nx-line' d='M0 212 L0 353 M-38 235 H38 M-43 267 H43 M-39 299 H39'/><path onclick="selectMuscle('Bíceps')" class='${cls('bicepsL')}' d='${armL}'/><path onclick="selectMuscle('Bíceps')" class='${cls('bicepsR')}' d='${armR}'/>`
   : `<path onclick="selectMuscle('Costas')" class='${cls('back')}' d='${back}'/><path class='nx-line' d='M0 100 L0 332 M-65 122 Q-27 160 0 197 Q27 160 65 122 M-82 178 Q-40 210 -28 268 M82 178 Q40 210 28 268'/><path onclick="selectMuscle('Tríceps')" class='${cls('tricepsL')}' d='${armL}'/><path onclick="selectMuscle('Tríceps')" class='${cls('tricepsR')}' d='${armR}'/>`}
  <path onclick="selectMuscle('Antebraço')" class='${cls('forearmL')}' d='${foreL}'/>
  <path onclick="selectMuscle('Antebraço')" class='${cls('forearmR')}' d='${foreR}'/>
  <path class='nx-base' d='M-48 354 Q-22 376 0 379 Q22 376 48 354 Q60 410 65 462 Q48 480 24 474 Q12 425 0 385 Q-12 425 -24 474 Q-48 480 -65 462 Q-60 410 -48 354Z'/>
  <path onclick="selectMuscle('Perna Superior')" class='${cls('thighL')}' d='${thighL}'/>
  <path onclick="selectMuscle('Perna Superior')" class='${cls('thighR')}' d='${thighR}'/>
  <path onclick="selectMuscle('Perna Inferior')" class='${cls('calfL')}' d='${calfL}'/>
  <path onclick="selectMuscle('Perna Inferior')" class='${cls('calfR')}' d='${calfR}'/>
  <path class='nx-line' d='M-55 392 Q-30 424 -20 480 M55 392 Q30 424 20 480 M-72 512 Q-52 530 -32 572 M72 512 Q52 530 32 572'/>
  <path class='nx-hand' d='M-176 382 Q-202 400 -207 429 Q-181 418 -163 393Z'/>
  <path class='nx-hand' d='M176 382 Q202 400 207 429 Q181 418 163 393Z'/>
 </g>
 </svg>`;
}

let currentSupportTicket=null;

function openSupport(){
 ensureSupportData();
 const modal=document.getElementById('supportModal');
 if(modal) modal.classList.remove('hidden');
 const start=document.getElementById('supportStart');
 const chat=document.getElementById('supportChat');
 if(start && chat && !currentSupportTicket){
  start.classList.remove('hidden');
  chat.classList.add('hidden');
 }
}

function closeSupport(){
 const modal=document.getElementById('supportModal');
 if(modal) modal.classList.add('hidden');
}

function supportFindAccount(emailS){
 ensureSupportData();
 const aluno=(db.alunos||[]).find(a=>cleanEmail(a.email)===emailS);
 const personal=(db.personais||[]).find(p=>cleanEmail(p.email)===emailS);
 if(aluno)return {tipo:'Aluno',nome:aluno.nome,plano:aluno.plano,email:aluno.email};
 if(personal)return {tipo:'Personal',nome:personal.nome,email:personal.email};
 return null;
}

function supportBotReply(msg,ticket){
 const m=String(msg||'').toLowerCase();
 const account=supportFindAccount(cleanEmail(ticket.email||''));

 if(m.includes('senha')||m.includes('reset')||m.includes('redefinir')||m.includes('não lembro')||m.includes('nao lembro')){
  if(account){
   return `Encontrei um cadastro de ${account.tipo} para este e-mail. Para proteger sua conta, confirme seu nome completo e um dado de verificação usado na recepção. Depois disso, a equipe pode redefinir sua senha com segurança.`;
  }
  return 'Não encontrei cadastro com este e-mail. Confira se digitou o mesmo e-mail usado na academia ou envie nome completo para a recepção localizar seu cadastro.';
 }

 if(m.includes('login')||m.includes('entrar')||m.includes('acessar')||m.includes('não consigo')||m.includes('nao consigo')){
  if(account){
   return `Localizei seu cadastro: ${account.nome}. Tente entrar com o e-mail informado e a senha cadastrada. Se continuar dando erro, confirme seu nome completo para abrir a redefinição de acesso.`;
  }
  return 'Vamos verificar seu acesso. Me envie o e-mail cadastrado na academia e seu nome completo para eu registrar corretamente no ticket.';
 }

 if(m.includes('email')||m.includes('e-mail')||m.includes('trocar email')||m.includes('alterar email')){
  return 'Para troca de e-mail, preciso que você informe o e-mail atual, o novo e-mail desejado e confirme sua identidade. A recepção valida esses dados antes de alterar o cadastro.';
 }

 if(m.includes('pagamento')||m.includes('mensalidade')||m.includes('pix')||m.includes('cartão')||m.includes('cartao')||m.includes('boleto')){
  return 'Sobre pagamento: verifique no painel do aluno se a mensalidade aparece como paga ou pendente. Se você já pagou e ainda consta pendente, envie a forma de pagamento e o horário aproximado para a recepção conferir.';
 }

 if(m.includes('plano')||m.includes('básico')||m.includes('basico')||m.includes('performance')||m.includes('elite')){
  return 'Os recursos variam conforme o plano. Básico libera acesso comum; Performance e Elite liberam acompanhamento avançado. Para alterar ou corrigir plano, a recepção precisa validar seu cadastro.';
 }

 if(m.includes('treino')||m.includes('personal')||m.includes('professor')){
  return 'Sobre treino: se ele não aparece, provavelmente ainda não foi criado ou o aluno não foi vinculado a um personal. Vou deixar registrado para a equipe verificar no painel.';
 }

 if(m.includes('nutri')||m.includes('dieta')||m.includes('peso')||m.includes('altura')||m.includes('água')||m.includes('agua')){
  return 'A nutrição é liberada para planos com acompanhamento. Um profissional autorizado cadastra dieta, peso, altura e água corporal. Se seu plano permite e não aparece, a recepção precisa conferir a liberação.';
 }

 if(m.includes('obrigado')||m.includes('valeu')||m.includes('ok')||m.includes('certo')){
  return 'Perfeito. Seu atendimento ficou registrado e pode ser acompanhado pela equipe da recepção.';
 }

 return 'Entendi. Para resolver mais rápido, me diga se o problema é com login, senha, e-mail, pagamento, plano, treino ou nutrição. Se envolver cadastro, envie nome completo e e-mail cadastrado.';
}

function startSupport(){
 ensureSupportData();
 const nome=cleanText(document.getElementById('supportName')?.value||'');
 const emailS=cleanEmail(document.getElementById('supportEmail')?.value||'');
 const assunto=cleanText(document.getElementById('supportSubject')?.value||'Suporte');

 if(!nome || !isValidEmail(emailS)) return alert('Informe nome e e-mail válido.');

 const hora=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
 const account=supportFindAccount(emailS);
 const intro=account
  ? `Olá, ${nome}. Encontrei um cadastro vinculado a este e-mail. Sou a IA Nexus e vou tentar resolver antes de encaminhar para a recepção.`
  : `Olá, ${nome}. Sou a IA Nexus. Não encontrei cadastro automático com este e-mail, mas vou registrar seu atendimento para a recepção validar.`;

 const ticket={
  id:nextId(db.tickets),
  nome,
  email:emailS,
  assunto,
  prioridade:'Normal',
  status:'Aberto',
  data:new Date().toLocaleString('pt-BR'),
  mensagens:[
   {autor:'IA Nexus',texto:intro,hora},
   {autor:'IA Nexus',texto:'Me conte o que aconteceu: é sobre login, senha, e-mail, pagamento, plano, treino ou nutrição?',hora}
  ]
 };

 db.tickets.push(ticket);
 currentSupportTicket=ticket.id;
 save();

 document.getElementById('supportStart').classList.add('hidden');
 document.getElementById('supportChat').classList.remove('hidden');
 renderSupportMessages();
}

function renderSupportMessages(){
 ensureSupportData();
 const box=document.getElementById('supportMessages');
 if(!box)return;
 const t=db.tickets.find(x=>x.id===currentSupportTicket);
 if(!t)return;

 box.innerHTML=t.mensagens.map(m=>`
  <div class='support-msg ${m.autor==='IA Nexus'?'bot':'user'}'>
   <b>${m.autor}</b>
   <p>${m.texto}</p>
   <small>${m.hora||''}</small>
  </div>
 `).join('');

 box.scrollTop=box.scrollHeight;
}

function sendSupportMessage(){
 ensureSupportData();
 const inp=document.getElementById('supportText');
 const msg=cleanText(inp?.value||'',SECURITY_LIMITS.maxLongText);
 if(!msg)return;

 let t=db.tickets.find(x=>x.id===currentSupportTicket);
 if(!t)return;

 const hora=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
 t.mensagens.push({autor:t.nome,texto:msg,hora});
 t.mensagens.push({autor:'IA Nexus',texto:supportBotReply(msg,t),hora});

 inp.value='';
 save();
 renderSupportMessages();
}

function pageTickets(){
 ensureSupportData();
 return `<div class='notice'>Tickets criados pelo suporte da tela de login. A IA Nexus tenta resolver primeiro; recepção e admin acompanham o histórico.</div>
 <div class='table-wrap'>
  <table>
   <tr><th>Cliente</th><th>E-mail</th><th>Assunto</th><th>Status</th><th>Data</th><th>Ações</th></tr>
   ${(db.tickets||[]).map(t=>`<tr>
    <td>${t.nome}</td>
    <td>${t.email}</td>
    <td>${t.assunto||'Suporte'}</td>
    <td><span class='${t.status==='Resolvido'?'paid':'warn'}'>${t.status}</span></td>
    <td>${t.data}</td>
    <td><button class='mini' onclick='viewTicket(${t.id})'>Ver conversa</button><button class='mini' onclick='resolveTicket(${t.id})'>Resolver</button></td>
   </tr>`).join('')||`<tr><td colspan='6'><span class='muted'>Nenhum ticket aberto.</span></td></tr>`}
  </table>
 </div>
 <div id='ticketDetail'></div>`;
}

function viewTicket(id){
 ensureSupportData();
 const t=db.tickets.find(x=>x.id===id);
 const box=document.getElementById('ticketDetail');
 if(!t||!box)return;
 box.innerHTML=`<div class='table-wrap ticket-detail'>
  <h2>Ticket de ${t.nome}</h2>
  <p class='muted'>Atendimento visualizado por <b>${current.nome}</b>.</p>
  <div class='ticket-chat-history'>
   ${t.mensagens.map(m=>`<div class='support-msg ${m.autor==='IA Nexus'?'bot':'user'}'><b>${m.autor}</b><p>${m.texto}</p><small>${m.hora||''}</small></div>`).join('')}
  </div>
  <div class='ticket-reply-box'>
   <input class='input' id='ticketReplyName' value='${current.nome}' placeholder='Seu nome no atendimento'>
   <div class='support-send'>
    <input class='input' id='ticketReplyText' placeholder='Responder ao cliente...'>
    <button onclick='replyTicket(${t.id})'>Responder</button>
   </div>
  </div>
 </div>`;
}

function replyTicket(id){
 ensureSupportData();
 const t=db.tickets.find(x=>x.id===id);
 if(!t)return;
 const nome=cleanText(document.getElementById('ticketReplyName')?.value||current.nome);
 const msg=cleanText(document.getElementById('ticketReplyText')?.value||'',SECURITY_LIMITS.maxLongText);
 if(!nome)return alert('Informe seu nome para o cliente saber com quem está falando.');
 if(!msg)return alert('Digite uma resposta.');
 const hora=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
 t.mensagens.push({autor:nome,texto:msg,hora});
 save();
 viewTicket(id);
}
function resolveTicket(id){
 ensureSupportData();
 db.tickets=db.tickets.map(t=>t.id===id?{...t,status:'Resolvido'}:t);
 save();
 route('tickets');
}
