/** Static visual inventory: AST, dependency graph and assets; no frontend execution/network. */
import ts from "typescript"
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import { walkSourceFiles } from "./consumers.mjs"
import tailwindConfig from "../frontend/tailwind.config.js"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const postcss = createRequire(path.join(ROOT, "frontend/package.json"))("postcss")
const resolveTailwind = createRequire(path.join(ROOT, "frontend/package.json"))("tailwindcss/resolveConfig")
const clean = text => text.replace(/\s+/g, " ").trim()
const hash = bytes => createHash("sha256").update(bytes).digest("hex")
const relative = file => path.relative(ROOT, file).split(path.sep).join("/")
const isTest = file => /\.(test|spec)\.[^.]+$/.test(file) || file.includes("/test/")
const uniq = values => [...new Set(values)].sort()
const jsxName = node => ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)
function containsJsx(node) {
  let found = false
  function visit(child) { if (jsxName(child) || ts.isJsxFragment(child)) found = true; else ts.forEachChild(child, visit) }
  visit(node); return found
}
function componentSignature(node, source) {
  const callback = ts.isArrowFunction(node) || ts.isFunctionExpression(node) ? node : ts.isCallExpression(node) ? node.arguments.find(argument => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) : null
  return callback ? "(" + callback.parameters.map(parameter => clean(parameter.getText(source))).join(", ") + ")" : "factory; conferir origem"
}
export function analyzeFile(text, filename) {
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, filename.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const result = { path: filename, sha256: hash(text), imports: [], components: [], contracts: [], recipes: [], elements: [], texts: [], portals: [], exports: [], navigation: [], translations: [], domCalls: [], stateEvidence: [], responsiveEvidence: [] }
  const line = node => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
  const signal = (state, node, evidence) => result.stateEvidence.push({ state, line: line(node), evidence: clean(evidence) })
  const exported = node => node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause, symbols = []
      if (clause?.name) symbols.push({ imported: "default", local: clause.name.text })
      if (clause?.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings)) symbols.push({ imported: "*", local: clause.namedBindings.name.text })
        else for (const item of clause.namedBindings.elements) symbols.push({ imported: item.propertyName?.text ?? item.name.text, local: item.name.text })
      }
      result.imports.push({ source: node.moduleSpecifier.text, symbols, line: line(node) })
    }
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name && /^[A-Z]/.test(node.name.text) && containsJsx(node)) result.components.push({ name: node.name.text, exported: !!exported(node), line: line(node), signature: node.parameters?.map(parameter => clean(parameter.getText(source))).join(", ") ?? "class" })
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      if (/^[A-Z]/.test(node.name.text) && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer) || ts.isCallExpression(node.initializer)) && containsJsx(node.initializer)) result.components.push({ name: node.name.text, exported: !!exported(node.parent.parent), line: line(node), signature: componentSignature(node.initializer, source) })
      if (/^(variants|sizes|tones|colors|styles|sizeClasses|toneClasses)$/i.test(node.name.text)) result.recipes.push({ name: node.name.text, line: line(node), source: node.initializer.getText(source) })
    }
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) result.contracts.push({ name: node.name.text, line: line(node), source: node.getText(source) })
    if (ts.isExportDeclaration(node)) {
      result.exports.push({ line: line(node), source: node.getText(source) })
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) result.imports.push({ source: node.moduleSpecifier.text, symbols: node.exportClause && ts.isNamedExports(node.exportClause) ? node.exportClause.elements.map(item => ({ imported: item.propertyName?.text ?? item.name.text, local: item.name.text })) : [{ imported: "*", local: "*" }], line: line(node), reexport: true })
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) result.imports.push({ source: node.arguments[0].text, symbols: [], line: line(node), dynamic: true })
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && exported(node)) result.exports.push({ line: line(node), name: node.name?.text, kind: ts.isClassDeclaration(node) ? "class" : "function" })
    if (ts.isVariableStatement(node) && exported(node)) for (const declaration of node.declarationList.declarations) result.exports.push({ line: line(node), name: declaration.name.getText(source), binding: declaration.initializer && (ts.isObjectLiteralExpression(declaration.initializer) || ts.isArrayLiteralExpression(declaration.initializer) || ts.isNumericLiteral(declaration.initializer) || ts.isStringLiteral(declaration.initializer)) ? clean(declaration.initializer.getText(source)) : null })
    if (jsxName(node)) {
      const attributes = node.attributes.properties.map(attribute => ts.isJsxAttribute(attribute) ? { name: attribute.name.getText(source), value: attribute.initializer ? clean(attribute.initializer.getText(source)) : "true" } : { name: "...", value: clean(attribute.expression.getText(source)) })
      const conditions = []
      let parent = node.parent
      while (parent && !ts.isFunctionDeclaration(parent)) {
        if (ts.isConditionalExpression(parent)) conditions.push(clean(parent.condition.getText(source)))
        if (ts.isBinaryExpression(parent) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(parent.operatorToken.kind)) conditions.push(clean(parent.left.getText(source)))
        if (ts.isIfStatement(parent)) conditions.push(clean(parent.expression.getText(source)))
        parent = parent.parent
      }
      result.elements.push({ tag: node.tagName.getText(source), line: line(node), column: source.getLineAndCharacterOfPosition(node.getStart(source)).character + 1, attributes, conditions: uniq(conditions) })
      const tag = node.tagName.getText(source)
      for (const attribute of attributes) {
        if (["loading", "isLoading", "isPending"].includes(attribute.name) && !/^(?:\{)?false(?:\})?$/.test(attribute.value)) signal("loading", node, `${tag}.${attribute.name}=${attribute.value}`)
        if (attribute.name === "empty" && !/^(?:\{)?false(?:\})?$/.test(attribute.value)) signal("vazio", node, `${tag}.empty=${attribute.value}`)
        if (["error", "erro"].includes(attribute.name) && !/^(?:\{)?(?:false|null)(?:\})?$/.test(attribute.value)) signal("erro", node, `${tag}.${attribute.name}=${attribute.value}`)
        if (["disabled", "aria-disabled"].includes(attribute.name) && !/^(?:\{)?false(?:\})?$/.test(attribute.value)) signal("desabilitado", node, `${tag}.${attribute.name}=${attribute.value}`)
      }
      if (tag === "ErrorBanner") signal("erro", node, `${tag}: ${attributes.find(attribute => attribute.name === "message")?.value ?? "conferir props"}`)
      if (tag === "SuccessState") signal("sucesso", node, `${tag}: conferir contexto (também usado para vazio/conclusão)`)
      for (const condition of uniq(conditions)) {
        if (/\b(?:loading|carregando|isLoading|isPending|saving\w*|salvando|operando|reenviando)\b/i.test(condition)) signal("loading", node, `guarda ${condition}`)
        if (/\b(?:erro\w*|error\w*|isError)\b/i.test(condition)) signal("erro", node, `guarda ${condition}`)
        if (/\.length\s*===?\s*0\b|\b(?:isEmpty|carteiraEmpty)\b/.test(condition)) signal("vazio", node, `guarda ${condition}`)
        if (/\b(?:feito|enviado|reenviado)\b|\.fase\s*===\s*["']sucesso["']/.test(condition)) signal("sucesso", node, `guarda ${condition}`)
      }
    }
    if (ts.isCallExpression(node) && /\bfeedback\.(?:run|show)$/.test(node.expression.getText(source)) && ts.isObjectLiteralExpression(node.arguments[0] ?? source)) {
      for (const property of node.arguments[0].properties) if (ts.isPropertyAssignment(property)) {
        const name = property.name.getText(source).replace(/["']/g, "")
        if (["loading", "success", "error"].includes(name)) signal({ loading: "loading", success: "sucesso", error: "erro" }[name], property, `${node.expression.getText(source)}.${name}: ${property.initializer.getText(source)}`)
        if (name === "status" && ts.isStringLiteral(property.initializer) && ["error", "success", "loading"].includes(property.initializer.text)) signal({ loading: "loading", success: "sucesso", error: "erro" }[property.initializer.text], property, `feedback.show status=${property.initializer.text}`)
      }
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      const literal = node.getText(source)
      const breakpoints = uniq([...literal.matchAll(/(?:^|[\s"'`])((?:(?:max-)?(?:sm|md|lg|xl|2xl)|(?:min|max)-\[[^\]]+\])):/g)].map(match => match[1]))
      if (breakpoints.length) result.responsiveEvidence.push({ line: line(node), breakpoints, evidence: clean(literal) })
    }
    if (ts.isCallExpression(node) && /(?:^|\.)matchMedia$/.test(node.expression.getText(source)) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      result.responsiveEvidence.push({ line: line(node), breakpoints: [], mediaQuery: node.arguments[0].text, evidence: clean(node.getText(source)) })
    }
    if (ts.isJsxText(node) && clean(node.text)) result.texts.push({ line: line(node), text: clean(node.text) })
    if (ts.isCallExpression(node) && /(?:^|\.)createPortal$/.test(node.expression.getText(source))) result.portals.push({ line: line(node), source: clean(node.getText(source)) })
    if (ts.isJsxAttribute(node) && ["to", "href"].includes(node.name.getText(source)) && node.initializer) result.navigation.push({ line: line(node), kind: "attribute", target: node.initializer.getText(source), literal: ts.isStringLiteral(node.initializer) ? node.initializer.text : null })
    if (ts.isPropertyAssignment(node) && ["to", "href", "path"].includes(node.name.getText(source).replace(/["']/g,""))) result.navigation.push({ line: line(node), kind: "configuration", target: node.initializer.getText(source), literal: ts.isStringLiteral(node.initializer) ? node.initializer.text : null })
    if (ts.isCallExpression(node) && /(?:^|\.)navigate$/.test(node.expression.getText(source)) && node.arguments[0]) result.navigation.push({ line: line(node), kind: "navigate", target: node.arguments[0].getText(source), literal: ts.isStringLiteral(node.arguments[0]) ? node.arguments[0].text : null })
    if (ts.isCallExpression(node) && /(?:^|\.)t$/.test(node.expression.getText(source))) result.translations.push({ line: line(node), key: node.arguments[0]?.getText(source) ?? null })
    if (ts.isCallExpression(node) && /(?:^|\.)createElement(?:NS)?$/.test(node.expression.getText(source))) result.domCalls.push({ line: line(node), source: clean(node.getText(source)) })
    ts.forEachChild(node, visit)
  }
  visit(source)
  result.stateEvidence = result.stateEvidence.filter((item, position, items) => items.findIndex(other => other.state === item.state && other.line === item.line && other.evidence === item.evidence) === position)
  return result
}
function resolveImport(file, specifier) {
  if (!specifier.startsWith(".")) return null
  const base = path.resolve(ROOT, path.dirname(file), specifier).replace(/\.js$/, "")
  return [base + ".tsx", base + ".ts", path.join(base, "index.tsx"), path.join(base, "index.ts")].find(existsSync)
}
export function routesFromApp(text) {
  const source = ts.createSourceFile("App.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), pages = new Map()
  function discover(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isArrowFunction(node.initializer)) {
      const call = node.initializer.body
      if (ts.isCallExpression(call) && call.expression.getText(source) === "lazyPage") {
        const [name, loader] = call.arguments
        const imported = loader && ts.isArrowFunction(loader) && ts.isCallExpression(loader.body) && loader.body.expression.kind === ts.SyntaxKind.ImportKeyword ? loader.body.arguments[0] : null
        if (!name || !ts.isStringLiteral(name) || !imported || !ts.isStringLiteral(imported)) throw Error("lazyPage dinâmico: atualizar o analisador")
        pages.set(node.name.text, { component: name.text, file: relative(resolveImport("frontend/src/App.tsx", imported.text) ?? path.resolve(ROOT, "frontend/src", imported.text)) })
      }
    }
    ts.forEachChild(node, discover)
  }
  discover(source)
  const routes = []
  function visit(node, protectedArea = false) {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(source) === "Route") throw Error("Route pareado: atualizar o analisador antes de reconciliar")
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "Route") {
      const routePath = node.attributes.properties.find(item => ts.isJsxAttribute(item) && item.name.text === "path")?.initializer
      const element = node.attributes.properties.find(item => ts.isJsxAttribute(item) && item.name.text === "element")
      if (!routePath || !ts.isStringLiteral(routePath)) throw Error("Route sem path literal: atualizar o analisador")
      const route = { path: routePath.text, component: null, file: null, access: protectedArea ? "autenticado" : "público", module: null, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 }
      if (route.path === "*") { route.component = "ProtectedRoute / AppLayout / ErrorBoundary"; route.access = "shell autenticado" }
      function elementVisit(child) {
        if (jsxName(child) && route.path !== "*") {
          const name = child.tagName.getText(source)
          if (pages.has(name)) Object.assign(route, pages.get(name))
          if (["AdminRoute", "SuperAdminRoute"].includes(name)) route.access = name === "AdminRoute" ? "admin/sócio" : "super_admin"
          if (name === "RequireModule") route.module = child.attributes.properties.find(item => ts.isJsxAttribute(item) && item.name.text === "mod")?.initializer?.text ?? null
        }
        ts.forEachChild(child, elementVisit)
      }
      if (element) elementVisit(element)
      if (route.path !== "*" && !route.component) throw Error(`Página não resolvida: ${route.path}`)
      routes.push(route)
      if (element && route.path === "*") { ts.forEachChild(element, child => visit(child, true)); return }
    }
    ts.forEachChild(node, child => visit(child, protectedArea))
  }
  visit(source); return routes
}
function resourceInventory(file) {
  const bytes = readFileSync(file), result = { path: relative(file), bytes: bytes.length, sha256: hash(bytes) }
  if (file.endsWith(".css")) {
    const tree = postcss.parse(bytes.toString("utf8"), { from: file })
    result.rules = []; result.atRules = []
    tree.walkRules(rule => result.rules.push({ selector: rule.selector, line: rule.source.start.line, declarations: (rule.nodes ?? []).filter(node => node.type === "decl").map(node => ({ property: node.prop, value: node.value, important: !!node.important })) }))
    tree.walkAtRules(rule => result.atRules.push({ name: rule.name, parameters: rule.params, line: rule.source.start.line }))
  }
  if (file.endsWith(".svg")) {
    const source = bytes.toString("utf8").replace(/<!--[\s\S]*?-->/g, "")
    result.svgElements = [...source.matchAll(/<([a-z][\w:.-]*)\b([^>]*?)(?:\/>|>)/gi)].map(match => ({ tag: match[1], attributes: [...match[2].matchAll(/([\w:.-]+)\s*=\s*("[^"]*"|'[^']*')/g)].map(attribute => ({ name: attribute[1], value: attribute[2].slice(1,-1) })) }))
  }
  return result
}
export function buildInventory() {
  const all = walkSourceFiles(path.join(ROOT, "frontend/src")).filter(file => /\.tsx?$/.test(file) && !isTest(file)).map(file => analyzeFile(readFileSync(file, "utf8"), relative(file)))
  const files = all.filter(file => file.elements.length || file.components.length)
  for (const file of all) for (const item of file.imports) { const resolved = resolveImport(file.path, item.source); item.resolved = resolved ? relative(resolved) : null }
  const routes = routesFromApp(readFileSync(path.join(ROOT, "frontend/src/App.tsx"), "utf8")), index = new Map(all.map(file => [file.path, file]))
  function reachable(start, found = new Set()) { if (!start || found.has(start)) return found; found.add(start); for (const item of index.get(start)?.imports ?? []) if (item.resolved) reachable(item.resolved, found); return found }
  for (const file of files) {
    file.consumers = all.filter(other => other.imports.some(item => item.resolved === file.path)).map(other => other.path)
    file.routes = routes.filter(route => reachable(route.file).has(file.path)).map(route => route.path)
    if (["frontend/src/App.tsx", "frontend/src/main.tsx"].includes(file.path)) file.scope = "entrada global do aplicativo"
    if (file.path.startsWith("frontend/src/shared/") && reachable("frontend/src/App.tsx").has(file.path) && !file.routes.length) file.scope = "global/shell/guard; conferir App.tsx"
  }
  for (const route of routes) route.navigationSources = all.filter(file => file.navigation.some(item => item.literal === route.path)).map(file => file.path)
  const resources = uniq([...walkSourceFiles(path.join(ROOT, "frontend/public")), ...["frontend/index.html", "frontend/tailwind.config.js", "frontend/tailwind.config.ts", "frontend/postcss.config.js", "frontend/package.json"].map(file => path.join(ROOT,file)).filter(existsSync), ...walkSourceFiles(path.join(ROOT, "frontend/src")).filter(file => /\.(css|svg|png|webp|jpg|woff2?|json)$/.test(file) || file.includes("/shared/theme/"))]).filter(file => !isTest(file)).map(resourceInventory)
  return { version: 1, source: "frontend/src + frontend/public; análise AST estática", counts: { routes: routes.length, concreteRoutes: routes.filter(route => route.path !== "*").length, pageFiles: uniq(routes.map(route => route.file).filter(Boolean)).length, jsxFiles: files.length, sharedJsxFiles: files.filter(file => file.path.includes("/shared/")).length, moduleJsxFiles: files.filter(file => file.path.includes("/modules/")).length, componentDeclarations: files.flatMap(file => file.components).length, jsxElements: files.flatMap(file => file.elements).length, resources: resources.length }, routes, files, supportFiles: all.filter(file => !files.includes(file)), resources }
}
const inlineCode = text => String.fromCharCode(96) + text + String.fromCharCode(96)
const escape = text => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\|/g, "\\|").replace(/\n/g, " ")
const link = file => `[${file}](../../../${file})`
const evidenceLink = item => `[${item.file}:${item.line}](../../../${item.file}#L${item.line}) — ${escape(item.evidence)}`
function checkedReference(file, needle) {
  const text = readFileSync(path.join(ROOT, file), "utf8"), position = text.indexOf(needle)
  if (position < 0) throw Error(`Evidência removida: ${file}: ${needle}`)
  return { file, line: text.slice(0, position).split("\n").length, evidence: needle }
}
export function routeStateRows(inventory) {
  const notes = JSON.parse(readFileSync(path.join(ROOT, "docs/engineering/design/ui-route-notes.json"), "utf8"))
  const routes = inventory.routes.filter(route => route.file), files = [...inventory.files, ...inventory.supportFiles], index = new Map(files.map(file => [file.path, file]))
  const ids = [...readFileSync(path.join(ROOT, "docs/product/06-CASOS-DE-USO.md"), "utf8").matchAll(/^### (UC-\d+[a-z]?)\b/gm)].map(match => match[1])
  if (new Set(ids).size !== ids.length) throw Error("IDs de UC duplicados em 06-CASOS-DE-USO.md")
  if (JSON.stringify(Object.keys(notes).sort()) !== JSON.stringify(routes.map(route => route.path).sort())) throw Error("Notas visuais sem cobertura exata das rotas atuais")
  function reachable(file, found = new Set()) { if (!file || found.has(file)) return found;found.add(file);for (const item of index.get(file)?.imports ?? []) if (item.resolved) reachable(item.resolved, found);return found }
  const rows = []
  for (const route of routes) {
    const note = notes[route.path], page = index.get(route.file), dependencies = [...reachable(route.file)].map(file => index.get(file)).filter(Boolean)
    if (!note.visual?.trim()) throw Error(`Descrição visual ausente: ${route.path}`)
    for (const id of note.useCases) if (!ids.includes(id)) throw Error(`UC inexistente: ${route.path}: ${id}`)
    const moduleFiles = [page, ...dependencies.filter(file => file !== page && file.path.includes("/modules/"))]
    for (const state of ["loading", "vazio", "erro", "sucesso", "desabilitado"]) {
      const matches = moduleFiles.flatMap(file => file.stateEvidence.filter(item => item.state === state).map(item => ({ ...item, file: file.path })))
      const evidence = matches.slice(0, 5)
      if (state === "sucesso") evidence.unshift({ file: route.file, line: page.components.find(component => component.name === route.component)?.line ?? 1, evidence: note.visual })
      const shared = state === "loading" ? [checkedReference("frontend/src/App.tsx", "<Suspense fallback=")] : []
      rows.push({ route: route.path, state, evidence: [...evidence, ...shared], evidenceCount: matches.length, note: state === "sucesso" ? "Referência visual descritiva do conteúdo pronto; sucesso de mutação só quando há sinal específico abaixo." : "Sinais locais/compostos; guardas não provam execução do ramo.", gap: note.gaps?.[state] ?? (!matches.length && state !== "sucesso" ? `SEM EVIDÊNCIA ESPECÍFICA de ${state} na página/composição; não inferir a partir da API genérica de componentes compartilhados. ` : "") + "Sem captura/validação funcional deste estado nesta revisão." })
    }
    const responsiveFiles = [...dependencies, ...(route.access !== "público" ? [index.get("frontend/src/shared/layout/AppLayout.tsx"), index.get("frontend/src/shared/layout/BottomTabBar.tsx")] : [])].filter(Boolean)
    const responsive = responsiveFiles.flatMap(file => file.responsiveEvidence.map(item => ({ ...item, file: file.path })))
    rows.push({ route: route.path, state: "responsividade", evidence: [...responsive.filter(item => item.mediaQuery), ...responsive.filter(item => !item.mediaQuery)].slice(0, 5), note: `Página: ${uniq(page.responsiveEvidence.flatMap(item => item.breakpoints)).join(", ") || "sem prefixo explícito"}; composição/shell: ${uniq(responsive.flatMap(item => item.breakpoints)).join(", ") || "sem prefixo explícito"}. Consultas runtime: ${uniq(responsive.map(item => item.mediaQuery).filter(Boolean)).join(", ") || "nenhuma identificada na composição"}. Valores resolvidos na tabela de breakpoints abaixo.`, gap: note.gaps?.responsividade ?? "Sem medição em viewport: testar375/768/1280px e ambos os lados dos breakpoints usados, zoom200%, teclado e safe-area." })
    const tags = new Set(page.elements.map(element => element.tag.split(".")[0]))
    const components = page.imports.flatMap(item => item.resolved ? item.symbols.filter(symbol => tags.has(symbol.local)).map(symbol => ({ file: page.path, line: item.line, evidence: `${symbol.local} → ${item.resolved}` })) : [])
    rows.push({ route: route.path, state: "componentes reutilizados", evidence: components, note: "Imports efetivamente usados no JSX da página; dependências transitivas e declarações locais no inventário completo.", gap: "Conferir variantes/overlays e todos os consumidores na repaginação; import não prova renderização simultânea." })
    const nav = note.navigation ? [checkedReference(note.navigation.file, note.navigation.needle)] : files.flatMap(file => file.navigation.filter(item => item.literal === route.path).map(item => ({ file: file.path, line: item.line, evidence: item.target })))
    rows.push({ route: route.path, state: "navegação", evidence: nav.slice(0, 5), note: note.navigation?.description ?? "Referências literais (menu, link ou redirecionamento); conferir perfil/módulo na origem.", gap: note.gaps?.navegação ?? (!nav.length ? "SEM ENTRADA IDENTIFICADA: conferir acesso direto/dinâmico." : "Validar retorno, parâmetros e gating com os perfis indicados em App.tsx.") })
    route.visualReview = { description: note.visual, useCases: note.useCases, navigation: note.navigation ?? null, explicitGaps: note.gaps ?? {} }
  }
  return rows
}
function statesMarkdown(inventory) {
  const rows = inventory.stateMatrix, screens = inventory.breakpoints
  const out = ["# Matriz visual e de estados por rota", "", "Gerada por `npm run docs:visual` a partir do AST, imports/reexports, configuração Tailwind e [notas revisadas](ui-route-notes.json). Não editar a tabela manualmente. Cada rota tem oito eixos; ausência de sinal é lacuna explícita, não prova de ausência do comportamento. Descrição é referência visual permitida; **não foram produzidas capturas nem aprovação de responsividade/estados nesta revisão**.", "", "## Fonte e critérios", "", "- [Rotas/elementos/recursos](UI-INVENTORY.md) e [JSON](ui-inventory.json): linhas, hashes e sinais completos; [componentes](04-UI-COMPONENTS.md).", "- [Casos de uso](../../product/06-CASOS-DE-USO.md), [tokens](05-TOKEN.md) e [padrões](06-UI-PATTERNS.md): contratos para a repaginação. UC vinculado é referência de fluxo, não cobertura integral da rota.", "- Sinais são da página e arquivos de módulos alcançados. Props genéricas de Button/Field não contam como binding concreto de disabled. Suspense é fallback de chunk, distinto do fetch da página. Dependência condicional não significa que todos os seus estados sejam visíveis juntos.", "", "## Breakpoints e cenários", "", "Fonte: `resolveConfig(frontend/tailwind.config.js)` com a versão Tailwind do lockfile. O projeto não sobrescreve screens; os valores abaixo são resolvidos da configuração efetiva, não assumidos.", "", "| Prefixo | Configuração efetiva |", "|---|---|", ...Object.entries(screens).map(([name, value]) => `| ${name} | ${escape(typeof value === "string" ? value : JSON.stringify(value))} |`), "", "Mobile base sem prefixo; shell usa lg para sidebar versus topo/tab bar. Modal usa sm para bottom-sheet versus diálogo central. Verificar375/768/1280px, bordas dos breakpoints usados, zoom200%, temas e teclado; valores configurados não equivalem a QA visual.", "", "## Rota × estado × evidência × lacuna", "", "| Rota | Estado / eixo | Evidência verificável e descrição | Lacuna / validação necessária |", "|---|---|---|---|"]
  for (const row of rows) out.push(`| \`${row.route}\` | ${row.state} | ${escape(row.note)}<br>${row.evidence.map(evidenceLink).join("<br>") || "Nenhum sinal específico extraído."} | ${escape(row.gap)} |`)
  out.push("", "## Vínculo com casos de uso", "", "| Rota | UC explicitamente relacionado | Lacuna |", "|---|---|---|")
  for (const route of inventory.routes.filter(route => route.file)) out.push(`| \`${route.path}\` | ${route.visualReview.useCases.join(", ") || "SEM UC ESPECÍFICO vinculado"} | ${route.visualReview.useCases.length ? "Executar conferências do UC; vínculo não é teste aprovado." : "Formalizar fluxo específico antes de declarar cobertura funcional."} |`)
  out.push("", "## Superfícies condicionais e globais", "", "| Superfície | Estado / condição | Evidência | Lacuna |", "|---|---|---|---|")
  const surfaces = [
    ["Todas as rotas lazy", "Chunk pendente / spinner", "frontend/src/App.tsx", "<Suspense fallback=", "Fallback de chunk não cobre erro de fetch da página; captura pendente."],
    ["ProtectedRoute", "Sessão carregando; token ausente", "frontend/src/shared/auth/ProtectedRoute.tsx", "if (loading)", "Validar restauração de sessão/retorno à URL; sem captura."],
    ["ContaSuspensaScreen", "user.status suspenso; preserva sessão e oferece sair", "frontend/src/shared/auth/ProtectedRoute.tsx", 'user?.status === "suspenso"', "Sem URL própria; testar usuário suspenso, logout e teclado."],
    ["AdminRoute / SuperAdminRoute", "Perfil sem acesso → redirecionamento", "frontend/src/shared/auth/AdminRoute.tsx", 'user?.role !== "admin"', "Conferir cada perfil e escopo de empresa; não há página dedicada de acesso negado nesse guard."],
    ["RequireModule", "Módulo desligado", "frontend/src/shared/auth/RequireModule.tsx", "<Navigate", "Validar gating com sessão ativa; UX não substitui enforcement backend UC-080."],
    ["ErrorBoundary", "Exceção de renderização no shell autenticado", "frontend/src/shared/components/ErrorBoundary.tsx", "if (this.state.hasError)", "Rotas públicas estão fora desse boundary em App.tsx; falha de chunk/render pública requer cobertura explícita."],
    ["Modal", "open, foco/teclado e sm bottom-sheet/diálogo", "frontend/src/shared/components/Modal/Modal.tsx", 'role="dialog"', "Validar foco, Escape, scroll e contraste em cada composição; não presumir aprovação por aria-modal."],
    ["FeedbackOverlay", "loading/success/error/warning/info ou hidden; faixa fixa superior", "frontend/src/shared/feedback/FeedbackOverlay.tsx", 'fixed top-0', "Não bloqueia toda a tela nem desabilita submit; UI-02 nos formulários sem binding."],
    ["PreferenciasModal / tema", "Paleta, light/dark/system", "frontend/src/shared/theme/ThemeProvider.tsx", 'root.dataset.theme', "Conferir cinco paletas e contraste; screenshot pendente."],
    ["Avatar / lightbox", "Iniciais ou foto; foto pode abrir Modal", "frontend/src/shared/components/Avatar/Avatar.tsx", 'open={aberto}', "Conferir erro de imagem, iniciais, ampliação, teclado e fechamento; sem captura."],
    ["Anexos / PDF", "pointer:coarse escolhe download; outro ponteiro permite iframe", "frontend/src/modules/cliente/components/AnexosSection.tsx", 'window.matchMedia("(pointer: coarse)")', "Não equivaler coarse a largura de tela; testar toque/ponteiro e PDF/imagem no modal."],
    ["URL autenticada desconhecida (*)", "Shell sem Route interna de fallback", "frontend/src/App.tsx", '<Route path="*"', "UI-03: nenhuma página404 interna encontrada; não descrever shell como tela404 implementada."],
  ]
  for (const [name, state, file, needle, gap] of surfaces) out.push(`| ${name} | ${escape(state)} | ${evidenceLink(checkedReference(file, needle))} | ${escape(gap)} |`)
  return out.join("\n") + "\n"
}
function markdown(inventory) {
  const lines = ["# Inventário visual derivado do código", "", "Gerado por `npm run docs:visual`. Não editar manualmente. `npm run docs:audit` recusa inventário divergente. Não é atestado de revisão visual, responsividade ou acessibilidade.", "", `**Escopo:** ${inventory.counts.concreteRoutes} rotas concretas + catch-all autenticado; ${inventory.counts.pageFiles} arquivos de página; ${inventory.counts.jsxFiles} arquivos com JSX; ${inventory.counts.componentDeclarations} declarações de componentes; ${inventory.counts.jsxElements} ocorrências JSX.`, "", "O [JSON](ui-inventory.json) contém cada elemento com arquivo/linha, atributos, condições de renderização, textos, interfaces/types, receitas de variantes e imports. Componentes locais, HTML, SVG, ícones e portais estão incluídos; nomes dinâmicos/estados em runtime exigem inspeção visual.", "", "## Rotas e superfícies", "", "| Rota | Página / shell | Acesso | Módulo | Fonte |", "|---|---|---|---|---|"]
  for (const route of inventory.routes) lines.push(`| \`${route.path}\` | ${route.component} | ${route.access} | ${route.module ?? "—"} | ${route.file ? link(route.file) : link("frontend/src/App.tsx")} |`)
  lines.push("", "ContaSuspensaScreen é superfície condicional de ProtectedRoute, sem URL própria. AdminPage é reutilizada em duas rotas. O catch-all é um shell, não uma página de negócio adicional.", "", "## Entradas de navegação", "", "O JSON registra referências literais e dinâmicas de links, configurações e navigate(). Rotas sem entrada literal podem depender de token, URL direta ou parâmetros; não inferir ausência de acesso apenas desse dado.", "", ...inventory.routes.filter(route => route.file && !route.navigationSources.length).map(route => "- " + inlineCode(route.path) + ": sem entrada literal detectada; conferir fluxo/contexto e App.tsx."), "", "## Arquivos, componentes e consumidores", "", "| Fonte | Componentes declarados (inclui locais) | Consumidores diretos | Rotas que alcançam o arquivo | Elementos JSX |", "|---|---|---|---|---|")
  for (const file of inventory.files) lines.push(`| ${link(file.path)} | ${escape(file.components.map(item => item.name + (item.exported ? "" : " (local)")).join(", ") || "composição JSX")} | ${file.consumers.map(link).join("<br>") || "sem import direto"} | ${file.routes.map(route => `\`${route}\``).join(", ") || file.scope || "não alcançado por página; conferir composição dinâmica"} | ${file.elements.length} |`)
  lines.push("", "## Elementos por arquivo", "", "Detalhe de atributos, condições e contratos no JSON; localizar modais, estados, HTML, SVG, ícones e componentes inline para o redesign.")
  for (const file of inventory.files) {
    const tags = uniq(file.elements.map(element => element.tag)), icons = file.imports.filter(item => item.source === "lucide-react").flatMap(item => item.symbols.map(symbol => symbol.local))
    lines.push("", `### ${file.path}`, "", `Fonte: ${link(file.path)}. Elementos: ${tags.map(inlineCode).join(", ")}.`, "", `Ícones: ${icons.join(", ") || "nenhum import direto de lucide-react"}. Contratos: ${file.contracts.map(item => `\`${item.name}\``).join(", ") || "inferidos/sem interface local"}. Portais: ${file.portals.length}.`)
  }
  lines.push("", "## Recursos visuais, temas e conteúdo", "", "| Arquivo | Bytes | SHA-256 |", "|---|---|---|")
  for (const item of inventory.resources) lines.push(`| ${link(item.path)} | ${item.bytes} | \`${item.sha256}\` |`)
  lines.push("", "## Uso na repaginação", "", "1. Selecionar uma rota e suas dependências no inventário.", "2. Conferir carregando/vazio/erro/sucesso, papéis/módulos, modais, confirmações, validações, teclado/foco, mobile/desktop e temas no navegador.", "3. Alterar componentes compartilhados junto de seus consumidores: `node scripts/consumers.mjs Nome`.", "4. Regenerar `npm run docs:visual`; executar auditorias UI/estilos/módulos/documentação e testes relevantes.", "5. Registrar evidência visual antes de marcar uma superfície como revisada. O inventário não declara aprovação visual de todas as telas.", "")
  return lines.join("\n")
}
function coverageMarkdown(inventory) {
  const out = ["# UI COVERAGE — superfícies atuais", "", "Gerado por `npm run docs:visual`. Base: código atual. Inventariado não significa aprovado visualmente; as marcas históricas de canonicidade não substituem validação no navegador.", "", `São **${inventory.counts.concreteRoutes} rotas concretas**, **${inventory.counts.pageFiles} arquivos de página**, um shell catch-all e a superfície condicional ContaSuspensaScreen. AdminPage é reutilizada no contexto da empresa.`, "", "## Telas e contextos", "", "| Rota | Componente | Acesso | Módulo | Fonte |", "|---|---|---|---|---|"]
  for (const route of inventory.routes.filter(route => route.file)) out.push(`| \`${route.path}\` | ${route.component} | ${route.access} | ${route.module ?? "—"} | ${link(route.file)} |`)
  out.push("", "## Superfícies transversais", "", "- AppLayout, sidebar, BottomTabBar e UserMenu: navegação condicionada por perfil/módulo.", "- ProtectedRoute/ContaSuspensaScreen e guards administrativos/de módulos: acesso, bloqueio e redirecionamento.", "- Suspense/ErrorBoundary/EstadoTela: carregamento, erro e recuperação.", "- FeedbackProvider: toast, confirmações e alertas; Modal: portal, overlay, foco e bottom-sheet mobile.", "- Avatar: iniciais/foto/lightbox; AvatarField usa MAX_LADO=640 em processarImagem.ts.", "- Temas, paletas, ícones/favicon/PWA, traduções, CSS e variantes: recursos e contratos no inventário.", "", "## Componentes, estados e elementos", "", `O [inventário completo](UI-INVENTORY.md) localiza os ${inventory.counts.jsxFiles} arquivos com JSX e suas declarações locais/compartilhadas. O [catálogo](04-UI-COMPONENTS.md) extrai assinaturas, interfaces/types e receitas. O [JSON](ui-inventory.json) registra cada ocorrência HTML/SVG/componente com linha, atributos e condições. A alcançabilidade é estática; não significa renderização simultânea.`, "", "## Gate da repaginação", "", "- [ ] Percorrer todos os perfis/módulos e contextos da rota.", "- [ ] Conferir desktop/mobile, temas/paletas, foco, teclado e acessibilidade.", "- [ ] Conferir carregando/vazio/erro/sucesso, validações, confirmações, menus, modais e sobreposições.", "- [ ] Atualizar consumidores ao alterar um componente compartilhado.", "- [ ] Executar docs:visual, docs:audit, audit:ui, audit:styles, audit:modules e testes relevantes.", "- [ ] Registrar capturas e resultado da revisão visual; nenhum check AST concede aprovação visual.", "")
  return out.join("\n")
}
function catalogMarkdown(inventory) {
  const out = ["# UI COMPONENTS", "", "Catálogo atual gerado do código por `npm run docs:visual`. Abrange componentes compartilhados, shells/guards/providers e componentes locais de módulos; os contratos abaixo são fonte extraída, não descrições históricas de APIs.", "", "Navegação: [rotas/consumidores/elementos](UI-INVENTORY.md), [cobertura e gate visual](UI-COVERAGE.md), [JSON com cada ocorrência JSX](ui-inventory.json). Para um componente, localizar seu nome neste documento ou usar `node scripts/consumers.mjs Nome`.", "", "## Convenções", "", "Card.Root/KpiCard são cards; Modal implementa overlay/portal e bottom-sheet responsivo; confirmação/empty/skeleton/list-item podem ser composições, não componentes autônomos. Usar nomes exportados reais e conferir o componente no código antes de criar um novo. Preservar semântica, acessibilidade, escopo por perfil/módulo e comportamento ao repaginar."]
  for (const file of inventory.files) {
    out.push("", `## ${file.path}`, "", `Fonte: ${link(file.path)}. Componentes: ${file.components.map(item => `\`${item.name}\``).join(", ") || "composição JSX"}.`, "", `Consumidores diretos: ${file.consumers.map(link).join(", ") || "nenhum import direto"}.`)
    for (const component of file.components) out.push("", `### ${component.name}`, "", `Linha ${component.line}; ${component.exported ? "exportado" : "local"}. Assinatura:`, "", "```typescript", component.signature, "```")
    for (const contract of file.contracts) out.push("", `### Contrato ${contract.name}`, "", "```typescript", contract.source, "```")
    for (const recipe of file.recipes) out.push("", `### Receita ${recipe.name}`, "", "```typescript", recipe.source, "```")
    const bindings = file.exports.filter(item => item.binding)
    for (const item of bindings) out.push("", `Export/composição ${item.name}:`, "", "```typescript", item.binding, "```")
  }
  out.push("", "## Recursos complementares", "", "AvatarField usa o processador compartilhado de imagens (MAX_LADO=640), não uma constante de200px do catálogo anterior. Seletores CSS, pseudo-elementos, declarações, media/keyframes e os elementos dos SVG locais são extraídos no JSON. Ícones lucide/SVG locais, mapas, gráficos Recharts, favicon/PWA, fontes, CSS, paletas e traduções estão localizados no inventário e em supportFiles do JSON. Props dinâmicas, componentes de bibliotecas e aparência efetiva exigem revisão no navegador.", "")
  return out.join("\n")
}
function mappingMarkdown(inventory) {
  const out = ["# MAPEAMENTO DE TELAS", "", "Gerado por `npm run docs:visual`; o CI recusa divergências. Fonte: App.tsx e dependências do frontend. Este mapa descreve o código, não certifica aparência/funcionalidade manual de cada tela.", "", "# Visão Geral", "", "| # | Tela / componente | Rota | Módulo | Acesso | Fonte |", "|---|---|---|---|---|---|"]
  let number = 0
  for (const route of inventory.routes.filter(route => route.file)) out.push(`| ${++number} | ${route.component} | \`${route.path}\` | ${route.module ?? "transversal"} | ${route.access} | [fonte](../../${route.file}) |`)
  out.push("", `**Total:** ${inventory.counts.concreteRoutes} rotas concretas; ${inventory.counts.pageFiles} arquivos de página; um catch-all/shell autenticado; ContaSuspensaScreen condicional sem URL própria. ${inventory.counts.jsxFiles} arquivos com JSX, ${inventory.counts.componentDeclarations} declarações com JSX, ${inventory.counts.jsxElements} elementos. Arquivos e componentes não são a mesma contagem.`, "", "# Árvore de Componentes", "", "A árvore completa e seus consumidores são derivados dos imports/reexports, incluindo componentes locais, em [UI-INVENTORY](design/UI-INVENTORY.md). O [JSON](design/ui-inventory.json) fornece cada elemento com linha, props/atributos, textos/traduções, condições e contratos. A alcançabilidade estática pode incluir composições condicionais e não significa renderização simultânea.", "", "# Mapeamento por Tela")
  for (const route of inventory.routes.filter(route => route.file)) {
    const page = inventory.files.find(file => file.path === route.file)
    out.push("", `## ${route.component} — ${route.path}`, "", `Fonte: [${route.file}](../../${route.file}). Acesso: ${route.access}; módulo: ${route.module ?? "transversal"}.`, "", `Composição direta: ${uniq(page?.elements.map(element => element.tag) ?? []).map(inlineCode).join(", ")}.`, "", "Revisão antes/depois do redesign: estados de carregamento/vazio/erro/sucesso, dados/perfil/módulo, campos e validações, modais/menus, foco/teclado, mobile/desktop e temas. Ver [gate de cobertura](design/UI-COVERAGE.md).")
  }
  out.push("", "# Superfícies globais e condicionais", "", "ContaSuspensaScreen, Suspense, ErrorBoundary, FeedbackProvider, navegação, preferências, confirmações, modais e lightboxes também estão no inventário. Estilos, assets, favicon/PWA e traduções são recursos versionados no JSON. Elementos dinâmicos e bibliotecas externas precisam ser observados no navegador.", "", "# Referências", "", "[Componentes](design/04-UI-COMPONENTS.md) · [Cobertura](design/UI-COVERAGE.md) · [Fluxos de uso](../product/06-CASOS-DE-USO.md) · [Registro anterior no Git](https://github.com/RafaCartaxo/nxgest/blob/e929d1ce32c550361c369491d45eaf04eb2bf9ea/docs/engineering/05-MAPEAMENTO-TELAS.md).", "")
  return out.join("\n")
}
export function synchronizeInventory(write = false) {
  const inventory = buildInventory(), stale = []
  inventory.version = 2
  inventory.breakpoints = resolveTailwind(tailwindConfig).theme.screens
  inventory.stateMatrix = routeStateRows(inventory)
  const stateReference = "\n\n[Estados por rota, referências visuais e lacunas](UI-STATES.md).\n"
  for (const [file, content] of [["docs/engineering/05-MAPEAMENTO-TELAS.md", mappingMarkdown(inventory) + "\n[Matriz de estados e evidências](design/UI-STATES.md).\n"], ["docs/engineering/design/ui-inventory.json", JSON.stringify(inventory, null, 2) + "\n"], ["docs/engineering/design/UI-INVENTORY.md", markdown(inventory) + stateReference], ["docs/engineering/design/UI-COVERAGE.md", coverageMarkdown(inventory) + stateReference], ["docs/engineering/design/04-UI-COMPONENTS.md", catalogMarkdown(inventory) + stateReference], ["docs/engineering/design/UI-STATES.md", statesMarkdown(inventory)]]) {
    const target = path.join(ROOT, file)
    if (!existsSync(target) || readFileSync(target, "utf8") !== content) { stale.push(file); if (write) writeFileSync(target, content) }
  }
  return { inventory, stale }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes("--write"), { inventory, stale } = synchronizeInventory(write)
  console.log(JSON.stringify(inventory.counts))
  if (stale.length && !write) { console.error(`Inventário visual desatualizado: ${stale.join(", ")}. Execute npm run docs:visual.`); process.exitCode = 1 }
  else console.log(write ? "Inventário visual reconciliado." : "Inventário visual coerente com o código.")
}
