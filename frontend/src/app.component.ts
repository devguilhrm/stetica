import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from './api.service';
import { ProductCardComponent } from './product-card.component';

type Field = {key: string; label: string; type?: string; required?: boolean; min?: number; max?: number; pattern?: string; options?: {value: any; label: string}[]};
@Component({selector: 'app-root', standalone: true, imports: [CommonModule, FormsModule, ProductCardComponent], templateUrl: './app.component.html'})
export class AppComponent implements OnInit {
 api = inject(ApiService);
 view = 'catalogo'; tab = 'resumo'; busca = ''; categoria = ''; tipo = '';
 itens: any[] = []; categorias: any[] = []; equipe: any[] = []; cart: any[] = [];
 rows: any[] = []; summary: any = {}; detail: any = null; selectedItem: any = null;
 message = ''; error = false; busy = false; loading = false;
 customer: any = JSON.parse(sessionStorage.getItem('stetica-cliente') || 'null');
 adminKey = ''; admin = false; login: any = {}; model: any = {}; editing: number | null = null;
 signup: any = {}; statusFilter = ''; idSearch = '';
 menu = [{key:'resumo', label:'Visão geral'}, {key:'itens',label:'Produtos e serviços'}, {key:'categorias',label:'Categorias'}, {key:'pessoas',label:'Clientes'}, {key:'funcionarios',label:'Funcionários'}, {key:'estoque',label:'Estoque'}, {key:'entradaprodutos',label:'Entradas'}, {key:'pedidos',label:'Pedidos'}];
 get detailFields(): {label:string; value:any}[] {
  const data=this.detail?.pessoa||this.detail||{};
  const labels:Record<string,string>={id:'ID',nome:'Nome',cpf:'CPF',dataNascimento:'Nascimento',sexo:'Sexo',email:'E-mail',telefone:'Telefone',ativo:'Ativo',cargo:'Cargo',dataAdmissao:'Admissão',descricao:'Descrição',categoria:'Categoria',categoriaId:'Categoria ID',tipo:'Tipo',preco:'Preço',precoVenda:'Preço de venda',precoCusto:'Preço de custo',unidade:'Unidade',quantidade:'Quantidade',estoque:'Estoque',produtoId:'Produto ID',data:'Data da entrada',valorUnitario:'Valor unitário',codigoPreco:'Código de preço'};
  const rows=Object.entries(labels).filter(([key])=>data[key]!==undefined).map(([key,label])=>({label,value:typeof data[key]==='boolean'?(data[key]?'Sim':'Não'):data[key]}));
  const address=data.endereco;
  if(address)rows.push({label:'Endereço',value:[address.logradouro,address.numero,address.complemento,address.bairro,address.cidade,address.uf,address.cep].filter(Boolean).join(', ')});
  if(this.detail?.pessoa)rows.push({label:'Cargo',value:this.detail.cargo},{label:'Admissão',value:this.detail.dataAdmissao?.slice(0,10)});
  return rows;
 }
 get cartCount() { return this.cart.reduce((s,l)=>s+l.quantidade,0); }
 get total() { return this.cart.reduce((s,l)=>s+l.preco*l.quantidade,0); }
 get title() { return this.menu.find(x=>x.key===this.tab)?.label || ''; }
 personFields: Field[] = [
  {key:'nome',label:'Nome completo',required:true,max:100}, {key:'cpf',label:'CPF (11 dígitos)',required:true,pattern:'[0-9]{11}'},
  {key:'dataNascimento',label:'Nascimento',type:'date',required:true}, {key:'sexo',label:'Sexo',required:true,options:[{value:'F',label:'Feminino'},{value:'M',label:'Masculino'},{value:'O',label:'Outro'}]},
  {key:'email',label:'E-mail',type:'email',required:true,max:100}, {key:'telefone',label:'Telefone com DDD',required:true,pattern:'[0-9]{10,11}'},
  {key:'cep',label:'CEP (8 dígitos)',required:true,pattern:'[0-9]{8}'}, {key:'logradouro',label:'Logradouro',required:true,max:150},
  {key:'numero',label:'Número',required:true,max:10}, {key:'bairro',label:'Bairro',required:true,max:100},
  {key:'cidade',label:'Cidade',required:true,max:100}, {key:'uf',label:'UF (sigla maiúscula)',required:true,pattern:'[A-Z]{2}'}, {key:'complemento',label:'Complemento',max:150}
 ];
 get fields(): Field[] {
  if(this.tab==='pessoas') return this.personFields;
  if(this.tab==='funcionarios') return [...this.personFields,{key:'cargo',label:'Cargo',required:true,max:50},{key:'dataAdmissao',label:'Admissão',type:'date',required:true}];
  if(this.tab==='categorias') return [{key:'nome',label:'Nome da categoria',required:true,max:35}];
  if(this.tab==='entradaprodutos') return [
   {key:'produtoId',label:'Produto',required:true,options:this.itens.filter(i=>i.tipo==='P'&&i.ativo).map(i=>({value:i.id,label:i.nome}))},
   {key:'quantidade',label:'Quantidade recebida',type:'number',required:true,min:1,max:1000000},
   {key:'data',label:'Data de entrada',type:'date',required:true}, {key:'valorUnitario',label:'Custo unitário (R$)',type:'number',required:true,min:0.01,max:99999999.99}];
  if(this.tab==='itens') return [
   {key:'nome',label:'Nome',required:true,max:40}, {key:'descricao',label:'Descrição',required:true,max:200},
   {key:'categoriaId',label:'Categoria',required:true,options:this.categorias.map(c=>({value:c.id,label:c.nome}))},
   {key:'tipo',label:'Tipo',required:true,options:[{value:'P',label:'Produto'},{value:'S',label:'Serviço'}]},
   {key:'preco',label:this.model.tipo==='S'?'Preço do serviço (R$)':'Preço de custo (R$)',type:'number',required:true,min:0.01,max:99999999.99},
   ...(this.model.tipo==='S'?[]:[{key:'codigoPreco',label:'Margem de venda',required:true,options:[{value:1,label:'4%'},{value:2,label:'8%'},{value:3,label:'10%'}]},{key:'unidade',label:'Unidade (UN, CX...)',required:true,max:10}]),
   {key:'ativo',label:'Situação',options:[{value:true,label:'Ativo'},{value:false,label:'Inativo'}]}];
  return [];
 }
 get canCreate() { return ['itens','categorias','funcionarios','entradaprodutos'].includes(this.tab); }
 get canEdit() { return ['itens','categorias','funcionarios','pessoas'].includes(this.tab); }
 get columns(): string[] {
  const columns: Record<string,string[]> = {itens:['id','nome','categoria','tipo','preco','estoque','ativo'],categorias:['id','nome'],pessoas:['id','nome','email','telefone','ativo'],funcionarios:['id','nome','cargo','ativo'],estoque:['id','nome','descricao','preco','precoVenda','unidade','categoria','quantidade','ativo'],entradaprodutos:['id','produtoId','data','quantidade','valorUnitario'],pedidos:['id','cliente','data','total','status']};
  return columns[this.tab]||[];
 }
 label(key: string) { const labels: Record<string,string>={id:'ID',nome:'Nome',categoria:'Categoria',tipo:'Tipo',preco:'Preço',precoVenda:'Venda',estoque:'Estoque',ativo:'Situação',email:'E-mail',telefone:'Telefone',cargo:'Cargo',produtoId:'Produto ID',data:'Data',quantidade:'Quantidade',valorUnitario:'Valor unitário',cliente:'Cliente',total:'Total',status:'Situação',descricao:'Descrição',unidade:'Unidade'};return labels[key]||key; }
 display(row: any,key: string): any { if(key==='ativo') return row[key]?'Ativo':'Inativo';if(key==='data')return new Date(row[key]).toLocaleDateString('pt-BR');if(['preco','precoVenda','total','valorUnitario'].includes(key))return Number(row[key]).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});return row[key]; }
 async ngOnInit() { await this.loadCatalog(); }
 notify(message: string,error=false) {this.message=message;this.error=error;}
 fail(e: any) { const body=e.error;this.notify(body?.message || (body?.errors?Object.values(body.errors).flat().join(' '):e.status===401?'Entre novamente ou confira a chave administrativa.':e.status===404?'Registro não encontrado.':'Não foi possível concluir. Confira a API e o banco.'),true); }
 async loadCatalog() {this.loading=true;try {const q=new URLSearchParams();if(this.busca)q.set('busca',this.busca);if(this.categoria)q.set('categoriaId',this.categoria);if(this.tipo)q.set('tipo',this.tipo);[this.itens,this.categorias,this.equipe]=await Promise.all([this.api.request('GET','itens?'+q),this.api.request('GET','categorias'),this.api.request('GET','equipe')]);}catch(e){this.fail(e);}finally{this.loading=false;} }
 async go(view: string) {this.view=view;this.detail=null;this.selectedItem=null;this.message='';if(view==='catalogo')await this.loadCatalog();if(view==='pedidos')await this.ownOrders();}
 add(i: any) {
  if(i.tipo==='P' && i.estoque<=0)return this.notify('Produto sem estoque.',true);
  const found=this.cart.find(l=>l.id===i.id);if(found){if(i.tipo==='S')return this.notify('O serviço já está no carrinho.');if(found.quantidade>=i.estoque)return this.notify('Quantidade indisponível.',true);found.quantidade++;}
  else this.cart.push({...i,quantidade:1,funcionarioId:this.equipe[0]?.id||null});this.notify(i.nome+' adicionado ao carrinho.');
 }
 async itemDetail(i: any) {try{this.selectedItem=await this.api.request('GET','itens/'+i.id);}catch(e){this.fail(e);}}
 quantity(line:any) {line.quantidade=Math.max(1,Math.min(line.estoque,Math.floor(Number(line.quantidade)||1)));}
 payload(data:any) {const x={...data};x.endereco={};for(const key of ['cep','logradouro','numero','bairro','cidade','uf','complemento']) {x.endereco[key]=x[key]||'';delete x[key];}return x;}
 async register(form:NgForm) {if(form.invalid){form.control.markAllAsTouched();return;}this.busy=true;try{this.setCustomer(await this.api.request('POST','clientes',this.payload(this.signup)));this.signup={};await this.go('carrinho');this.notify('Cadastro realizado. Bem-vindo à Stetica.');}catch(e){this.fail(e);}finally{this.busy=false;}}
 setCustomer(result:any) {sessionStorage.setItem('stetica-token',result.token);sessionStorage.setItem('stetica-cliente',JSON.stringify(result.cliente));this.customer=result.cliente;}
 async signIn(form:NgForm) {if(form.invalid)return;this.busy=true;try{this.setCustomer(await this.api.request('POST','sessoes',this.login));this.login={};await this.go('pedidos');this.notify('Você entrou na sua conta.');}catch(e){this.fail(e);}finally{this.busy=false;}}
 async logout() {try{await this.api.request('DELETE','sessoes');}catch{}sessionStorage.removeItem('stetica-token');sessionStorage.removeItem('stetica-cliente');this.customer=null;this.rows=[];await this.go('catalogo');}
 async checkout() {if(!this.customer)return this.go('conta');if(!this.cart.length)return;if(this.cart.some(l=>!l.funcionarioId))return this.notify('Selecione o funcionário de cada item.',true);this.busy=true;try{const order=await this.api.request('POST','pedidos',{itens:this.cart.map(l=>({itemId:l.id,quantidade:l.quantidade,funcionarioId:Number(l.funcionarioId)}))});this.cart=[];await this.go('pedidos');this.detail=order;this.notify('Pedido #'+order.id+' registrado.');}catch(e){this.fail(e);}finally{this.busy=false;}}
 async ownOrders() {if(!this.customer){this.rows=[];return;}this.loading=true;try{this.rows=await this.api.request('GET','meus-pedidos');}catch(e){this.fail(e);}finally{this.loading=false;}}
 async orderDetail(id:number) {try{this.detail=await this.api.request('GET',(this.view==='admin'?'pedidos/':'meus-pedidos/')+id);}catch(e){this.fail(e);}}
 async enterAdmin() {sessionStorage.setItem('stetica-admin',this.adminKey);this.busy=true;try{this.summary=await this.api.request('GET','resumo');this.admin=true;this.adminKey='';await this.openTab('resumo');}catch(e){sessionStorage.removeItem('stetica-admin');this.fail(e);}finally{this.busy=false;}}
 leaveAdmin() {sessionStorage.removeItem('stetica-admin');this.admin=false;this.go('catalogo');}
 resetForm(form?:NgForm) {this.editing=null;this.model={tipo:'P',ativo:true,codigoPreco:1,unidade:'UN',sexo:'O',data:new Date().toISOString().slice(0,10)};form?.resetForm(this.model);}
 async openTab(tab:string) {this.tab=tab;this.detail=null;this.idSearch='';this.rows=[];this.message='';this.resetForm();this.loading=true;try {this.categorias=await this.api.request('GET','categorias');if(tab==='resumo')this.summary=await this.api.request('GET','resumo');else{if(['itens','entradaprodutos'].includes(tab))this.itens=await this.api.request('GET','admin/itens');await this.loadRows();}}catch(e){this.fail(e);}finally{this.loading=false;}}
 async loadRows() {this.rows=await this.api.request('GET',this.tab==='itens'?'admin/itens':this.tab==='pedidos'?'pedidos'+(this.statusFilter?'?status='+encodeURIComponent(this.statusFilter):''):this.tab);}
 async findId() {if(!/^\d+$/.test(this.idSearch))return this.notify('Informe um ID numérico.',true);try{this.detail=await this.api.request('GET',this.tab+'/'+this.idSearch);this.notify('Registro encontrado.');}catch(e){this.detail=null;this.fail(e);}}
 edit(row:any) {this.editing=row.id;this.model={...row,...row.endereco};this.model.id=row.id;if(row.dataNascimento)this.model.dataNascimento=row.dataNascimento.slice(0,10);if(row.dataAdmissao)this.model.dataAdmissao=row.dataAdmissao.slice(0,10);if(this.tab==='itens')this.model.preco=row.precoCusto;document.getElementById('editor')?.scrollIntoView({behavior:'smooth'});}
 async save(form:NgForm) {if(form.invalid){form.control.markAllAsTouched();return;}this.busy=true;try {const data=['pessoas','funcionarios'].includes(this.tab)?this.payload(this.model):this.model;await this.api.request(this.editing?'PUT':'POST',this.tab+(this.editing?'/'+this.editing:''),data);this.resetForm(form);await this.loadRows();this.notify('Dados salvos com sucesso.');}catch(e){this.fail(e);}finally{this.busy=false;}}
 async remove(row:any) {if(!confirm(this.tab==='categorias'?'Excluir esta categoria?':'Desativar este registro?'))return;this.busy=true;try{await this.api.request('DELETE',this.tab+'/'+row.id);await this.loadRows();this.notify('Operação realizada.');}catch(e){this.fail(e);}finally{this.busy=false;}}
 async changeStatus(status:string) {this.busy=true;try{await this.api.request('PUT','pedidos/'+this.detail.id+'/status',{status});await this.orderDetail(this.detail.id);await this.loadRows();this.notify('Situação atualizada.');}catch(e){this.fail(e);}finally{this.busy=false;}}
}
