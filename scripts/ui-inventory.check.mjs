import {test} from 'node:test'
import assert from 'node:assert/strict'
import {analyzeFile,routesFromApp,buildInventory} from './ui-inventory.mjs'

test('AST maps aliases, local components, intrinsic SVG, conditions, props and translation keys',()=>{
 const f=analyzeFile(`import {Modal as Dialog} from './Modal.js'; interface Props {open:boolean}; function Local(){return <svg><path d="x" /></svg>}; export const View=({open}:Props)=><>{open && <Dialog title={t('title')}><Local/><span role="status">Ready</span></Dialog>}</>;`,'fixture.tsx')
 assert.deepEqual(f.components.map(c=>c.name),['Local','View']);assert.equal(f.imports[0].symbols[0].local,'Dialog')
 assert.ok(f.elements.some(e=>e.tag==='Dialog'&&e.conditions.includes('open')))
 assert.ok(f.elements.some(e=>e.tag==='span'&&e.attributes.some(a=>a.name==='role')))
 assert.ok(f.translations.some(t=>t.key==="'title'"));assert.equal(f.contracts[0].name,'Props')
})
test('TypeScript generics do not become imaginary JSX components',()=>{
 const f=analyzeFile('export const Identity = <T>(value:T):T => value','fixture.ts')
 assert.equal(f.elements.length,0);assert.equal(f.components.length,0)
})
test('JSX-valued arrays are visual data, not component declarations; reexports preserve dependency edges',()=>{
 const f=analyzeFile(`export {Card} from './Card.js'; const Items=[<span/>]; const Box=()=> <div/>`,'fixture.tsx')
 assert.deepEqual(f.components.map(c=>c.name),['Box']);assert.equal(f.imports[0].reexport,true)
})
test('route AST resolves single quotes, protected shells, administrative guards and reused pages',()=>{
 const f=routesFromApp(`const Login=()=>lazyPage('LoginPage',()=>import('./modules/auth/pages/LoginPage.js'));const Admin=()=>lazyPage('AdminPage',()=>import('./modules/admin/pages/AdminPage.js'));const x=<Routes><Route path='/login' element={<Login/>}/><Route path='*' element={<ProtectedRoute><Routes><Route path='/admin' element={<AdminRoute><Admin/></AdminRoute>}/><Route path='/tenant' element={<SuperAdminRoute><Admin/></SuperAdminRoute>}/></Routes></ProtectedRoute>}/></Routes>`)
 assert.equal(f.length,4);assert.equal(f[0].access,'público');assert.equal(f[2].access,'admin/sócio');assert.equal(f[3].access,'super_admin');assert.equal(f[2].file,f[3].file)
})
test('unresolved pages and unsupported route syntax fail instead of silently losing coverage',()=>{
 assert.throws(()=>routesFromApp('const x=<Route path="/lost" element={<Missing/>}/>'),/não resolvida/)
 assert.throws(()=>routesFromApp('const x=<Route path="/lost"></Route>'),/pareado/)
})
test('current inventory resolves all page sources and barrel imports, including Insights and ChartCard',()=>{
 const i=buildInventory();assert.equal(new Set(i.routes.map(r=>r.path)).size,i.routes.length)
 for(const route of i.routes.filter(r=>r.path!=='*'))assert.ok(i.files.some(f=>f.path===route.file),route.path)
 assert.ok(i.routes.some(r=>r.path==='/insights'));assert.ok(i.files.find(f=>f.path.endsWith('/Card/Card.tsx')).routes.includes('/insights'))
 assert.ok(i.files.find(f=>f.path.endsWith('/ChartCard/ChartCard.tsx')).routes.includes('/insights'))
})

test('render guards remain visible through list callbacks and navigation references are recorded',()=>{
 const f=analyzeFile(`export const View=()=> <>{open && items.map(item=><a href="/insights">{t('more')}</a>)}</>`, 'fixture.tsx')
 assert.ok(f.elements.find(e=>e.tag==='a').conditions.includes('open'))
 assert.ok(f.navigation.some(n=>n.literal==='/insights'))
})

test('stylesheet rules, responsive/animation at-rules and SVG attributes are inventoried without rendering',()=>{
 const i=buildInventory();const css=i.resources.find(r=>r.path==='frontend/src/index.css')
 assert.ok(css.rules.some(r=>r.selector.includes('input')))
 assert.ok(css.atRules.some(r=>r.name==='layer'))
 assert.ok(i.resources.find(r=>r.path.endsWith('/favicon.svg')).svgElements.some(e=>e.tag==='svg'))
})
