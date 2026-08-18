# Sessão de QA — Board Dev (PLAN-078)

Plano de teste manual do board de visibilidade de git/CI (`/devboard`).

**Escopo:** runs de CI/CD + PRs abertos + dependabot.
**Ambientes:** DEV (local) e HML (staging).

## Critérios de aceite (cruzamento CT ↔ critério)

| # | Critério | CTs que cobrem |
|---|---|---|
| C1 | `/devboard` acessível apenas com login + papel **super_admin** | CT-001, CT-002, CT-003 |
| C2 | Mostra runs de CI/CD (workflow, branch, status, conclusão, duração, tempo) | CT-004, CT-005 |
| C3 | Mostra PRs abertos (nº, título, branch, rascunho) | CT-006 |
| C4 | Destaca/lista PRs do dependabot separados | CT-007 |
| C5 | KPIs (runs, verdes, falhas, PRs) coerentes com as listas | CT-008 |
| C6 | Erros da API do GitHub tratados sem quebrar o app | CT-009, CT-010, CT-011, CT-012 |
| C7 | Estados vazios elegantes | CT-013 |
| C8 | Layout responsivo (mobile/desktop) | CT-014, CT-015 |

---

### **CT-001 Acessar o board logado como super_admin**

**Dado** que estou logado com papel super_admin
**Quando** acesso a rota `/devboard`
**Então** vejo o cabeçalho "Board Dev" e os blocos de runs, PRs e dependabot

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-002 Acessar o board sem login**

**Dado** que não estou autenticado
**Quando** acesso a rota `/devboard`
**Então** sou redirecionado para `/login`

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-003 Acessar o board como admin/sócio (não-super)**

**Dado** que estou logado com papel admin ou sócio
**Quando** acesso a rota `/devboard`
**Então** sou redirecionado para `/admin` (sem acesso — exclusividade do super_admin)
**E** o endpoint `/api/devboard/*` responde **403 FORBIDDEN**

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-004 Exibir runs de CI/CD com informações completas**

**Dado** que há runs concluídos e em andamento
**Quando** visualizo o bloco "Runs de CI/CD"
**Então** cada run mostra nome do workflow, branch, status, conclusão, duração e há-quanto foi

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-005 Exibir badge de status correto por conclusão**

**Dado** que há runs com conclusões variadas (success/failure/em andamento)
**Quando** visualizo o bloco de runs
**Então** o badge reflete o estado: verde (success), vermelho (failure), azul (rodando)

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-006 Exibir PRs abertos com número, título e branch**

**Dado** que há PRs abertos no repositório
**Quando** visualizo o bloco "Pull requests abertos"
**Então** cada PR mostra número, título e branch, com badge "rascunho" quando aplicável

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-007 Exibir PRs do dependabot separados**

**Dado** que há PRs do dependabot abertos
**Quando** visualizo o bloco "Dependabot"
**Então** apenas os PRs do dependabot aparecem, com badge "dependabot"

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-008 KPIs coerentes com as listas**

**Dado** que as listas estão carregadas
**Quando** comparo os KPIs com as listas de runs e PRs
**Então** os contadores (runs, verdes, falhas, PRs) batem com o que é exibido

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-009 API do GitHub indisponível**

**Dado** que a GitHub API retorna erro (5xx)
**Quando** o board tenta carregar
**Então** aparece mensagem de erro amigável com botão de tentar novamente, sem travar o app

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-010 GITHUB_TOKEN ausente no servidor**

**Dado** que `GITHUB_TOKEN` não está configurado
**Quando** o board tenta carregar
**Então** o endpoint responde `503 GITHUB_TOKEN_AUSENTE` e o frontend mostra erro controlado

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-011 Rate limit da GitHub (429)**

**Dado** que a GitHub API atinge rate limit
**Quando** o board tenta carregar
**Então** o erro é tratado como `GITHUB_API_ERROR` sem quebrar o app

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-012 Timeout da API do GitHub**

**Dado** que a GitHub API demora mais que o limite
**Quando** o board tenta carregar
**Então** o endpoint responde `504 GITHUB_TIMEOUT` e o frontend mostra erro controlado

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-013 Estado vazio**

**Dado** que não há runs ou PRs abertos
**Quando** visualizo cada bloco
**Então** aparece mensagem de estado vazio elegante (sem listas quebradas)

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-014 Layout responsivo**

**Dado** que acesso o board no mobile e no desktop
**Quando** redimensiono/uso no celular
**Então** os cards e KPIs se ajustam sem sobreposição, íntegros e legíveis

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica

---

### **CT-015 Acesso ao board pela tab bar no mobile (super_admin)**

**Dado** que estou logado como super_admin no mobile
**Quando** abro a barra inferior de navegação
**Então** vejo a aba "Board" (ícone de monitoramento) junto de Empresas/Leads
**E** toco nela para acessar `/devboard`

**Execução Passou?**
- [ ] Sim
- [ ] Não
- [ ] Não se aplica
