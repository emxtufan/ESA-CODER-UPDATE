import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {chromium} from 'playwright';

// Run tracking code with isolated storage and no external network.
function consentFixture() {
  const storage = new Map();
  const session = new Map();
  const scripts = [];
  const events = [];
  const config = {'google-analytics-id':'G-TEST1234','google-ads-id':'AW-12345678','google-ads-lead-label':'testlabel','meta-pixel-id':'123456789012345'};
  const api = m => ({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
  const context = vm.createContext({fetch:async()=>({ok:true}),AbortSignal,exports:{},require:()=>({getSourceData:()=>({'settings/tracking':config})}),localStorage:api(storage),sessionStorage:api(session),Event,location:{hostname:'example.com',pathname:'/contact',reload:()=>events.push('reload')},document:{cookie:'',createElement:()=>({}),head:{appendChild:s=>scripts.push(s.src)}},window:{dispatchEvent:e=>events.push(e.type)}});
  const compile = p => ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInContext('(function(exports){'+compile('src/lib/consent.ts')+'})(exports)',context);
  return {c:context.exports,context,storage,session,scripts,events,config,compile};
}
for (const choice of [{statistics:true,marketing:false},{statistics:false,marketing:true},{statistics:false,marketing:false}]) {
  const {c,context,scripts}=consentFixture();
  assert.equal(c.readConsent(),null);
  await c.saveConsent(choice); c.trackLead();
  const calls=(context.window.dataLayer??[]).map(a=>Array.from(a));
  assert.equal(scripts.some(s=>s.includes('G-TEST')),choice.statistics);
  assert.equal(scripts.some(s=>s.includes('facebook')),choice.marketing);
  assert.equal(calls.some(a=>a[1]==='conversion'),choice.marketing);
  assert.equal(calls.some(a=>a[1]==='generate_lead'),choice.statistics);
}
{
  const {c,storage,session,events,config}=consentFixture();
  storage.set('vv-consent','granted');assert.equal(c.readConsent(),null);
  await c.saveConsent({statistics:true,marketing:true});
  session.set('vv-visit','old');
  await c.saveConsent({statistics:false,marketing:false});
  assert.equal(session.has('vv-visit'),false);assert.ok(events.includes('reload'));
  config['google-analytics-id']='G-CHANGED';assert.equal(c.readConsent(),null);
}
{
  const {c,context,session,compile}=consentFixture();
  const beacons=[];
  Object.assign(context,{exports:{},require:()=>c,navigator:{webdriver:false,sendBeacon:(_url,body)=>{beacons.push(body);return true;},language:'ro-RO',maxTouchPoints:0},crypto:{randomUUID:()=> 'session-id'},screen:{width:1200,height:800},URLSearchParams,Blob});
  context.location.search='';
  vm.runInContext('(function(exports){'+compile('src/lib/visits.ts')+'})(exports)',context);
  const visits=context.exports;
  visits.trackView('/contact');assert.equal(beacons.length,0);assert.equal(session.size,0);
  await c.saveConsent({statistics:true,marketing:false});visits.trackView('/contact');assert.equal(beacons.length,1);
  await c.saveConsent({statistics:false,marketing:false});visits.trackView('/contact');visits.trackView('/works');assert.equal(beacons.length,1);
  await c.saveConsent({statistics:true,marketing:false});visits.trackView('/contact');assert.equal(beacons.length,2);
}
console.log('PASS: consent categories, conversion destinations, old choices, revocation, internal statistics');
{
  const {c,context,scripts}=consentFixture();
  context.localStorage.setItem=()=>{throw new Error('Storage blocked');};
  assert.equal(await c.saveConsent({statistics:true,marketing:true}),false);
  assert.equal(scripts.length,0);
}

if(process.env.PRIVACY_UNIT_ONLY==='1') process.exit(0);
const base=process.env.PRIVACY_TEST_URL || 'http://127.0.0.1:5117';
const browser=await chromium.launch({headless:true});
try {
  for (const width of [390,768,1440]) {
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
    await context.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
    let visits=0;
    await context.route('**/api/visits',route=>{visits++;return route.fulfill({status:204});});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    for(const urlPath of ['/politica-de-confidentialitate','/politica-de-cookies']) {
      const response=await page.goto(base+urlPath);
      assert.equal(response.status(),200);
      await page.getByRole('heading',{level:1}).waitFor();
      await page.locator('#boot').waitFor({state:'hidden'});
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://esa-coder-solutions.com'+urlPath);
      assert.ok(await page.locator('meta[name=description]').getAttribute('content'));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.equal(await page.locator('nav[aria-label=Cuprins] a').evaluateAll(as=>as.every(a=>document.getElementById(a.hash.slice(1)))),true);
      await page.screenshot({path:path.join(os.tmpdir(),`esa-privacy-${width}-${urlPath.endsWith('cookies')?'cookies':'policy'}.png`),fullPage:true});
    }
    assert.equal(visits,0);
    await page.getByRole('button',{name:'Personalizează',exact:true}).click();
    assert.equal(await page.locator('input[type=checkbox]:checked').count(),0);
    await page.getByRole('button',{name:'Respinge opționale',exact:true}).click();
    assert.equal(visits,0);
    await page.reload();
    await page.locator('footer').getByRole('button',{name:'Preferințe cookie-uri'}).click();
    await page.getByRole('checkbox').check();
    await Promise.all([page.waitForResponse(r=>r.url().endsWith('/api/visits')), page.getByRole('button',{name:'Salvează alegerile'}).click()]);
    await page.waitForFunction(()=>!!sessionStorage.getItem('vv-visit'));
    assert.equal(visits,1);
    await page.locator('footer').getByRole('button',{name:'Preferințe cookie-uri'}).click();
    await page.getByRole('button',{name:'Respinge opționale',exact:true}).click();
    await page.waitForFunction(()=>sessionStorage.getItem('vv-visit')===null);
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('vv-visit')),null);
    await page.goto(base+'/contact');
    assert.equal(await page.locator('form a[href="/politica-de-confidentialitate"]').count(),1);
    assert.equal(visits,1);
    assert.deepEqual(errors,[]);
    console.log(`PASS: ${width}px layout, metadata, anchors, refusal, acceptance, withdrawal, contact notice`);
    await context.close();
  }
  const r=await fetch(base+'/privacy-policy',{redirect:'manual'});
  assert.equal(r.status,301);assert.equal(r.headers.get('location'),'/politica-de-confidentialitate');
  const context=await browser.newContext({reducedMotion:'reduce'});
  const data=JSON.parse(fs.readFileSync('source_data.json','utf8'));
  data['settings/tracking']={'google-analytics-id':'G-TEST1234','google-ads-id':'AW-12345678','google-ads-lead-label':'testlabel','meta-pixel-id':'123456789012345'};
  await context.addInitScript(data => {window.__SOURCE_DATA__ = data;}, data);
  await context.route('**/content.js',route=>route.fulfill({contentType:'text/javascript',body:'window.__SOURCE_DATA__='+JSON.stringify(data)}));
  const external=[];
  await context.route(/https:\/\/(www.googletagmanager.com|connect.facebook.net)\//,route=>{external.push(route.request().url());return route.fulfill({contentType:'text/javascript',body:''});});
  await context.route('**/api/visits',route=>route.fulfill({status:204}));
  const page=await context.newPage();
  await page.goto(base+'/politica-de-cookies');
  await page.getByRole('button',{name:'Personalizează',exact:true}).click();
  assert.equal(external.length,0);
  await page.getByRole('checkbox').first().check();
  const evidenceResponse = page.waitForResponse(r=>r.url().endsWith('/api/consent'));
  await page.getByRole('button',{name:'Salvează alegerile'}).click();
  const evidence = await evidenceResponse;
  assert.equal(evidence.status(),200);
  await page.waitForFunction(()=>window.dataLayer?.length>0);
  assert.equal(external.length,1);assert.ok(external[0].includes('G-TEST1234'));
  assert.equal(await page.evaluate(()=>window.dataLayer.some(a=>a[0]==='config'&&String(a[1]).startsWith('AW-'))),false);
  await page.locator('footer').getByRole('button',{name:'Preferințe cookie-uri'}).click();
  await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:'Respinge opționale',exact:true}).click()]);
  assert.equal(external.length,1);
  await page.locator('footer').getByRole('button',{name:'Preferințe cookie-uri'}).click();
  for(const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await page.getByRole('button',{name:'Salvează alegerile'}).click();
  await page.waitForFunction(()=>typeof window.fbq==='function');
  assert.ok(external.some(u=>u.includes('facebook')));
  const links=await page.locator('a[href^="/"]').evaluateAll(as=>[...new Set(as.map(a=>a.getAttribute('href').split('#')[0]))]);
  for(const path of links){assert.equal((await fetch(base+(path||'/'))).status,200,path);}
  let submitted=false;
  await context.route('**/api/contact',route=>{submitted=true;return route.fulfill({contentType:'application/json',body:'{"ok":true}'});});
  await page.goto(base+'/contact');
  await page.locator('form button[type=submit]').click();
  assert.equal(submitted,false);
  await page.locator('input[name=name]').fill('Test confidențialitate');
  await page.locator('input[name=email]').fill('privacy-test@example.invalid');
  await page.getByRole('combobox').first().fill('Romania');
  await page.getByRole('option',{name:'Romania',exact:true}).click();
  await page.locator('input[name=budget]').first().locator('..').click();
  await page.locator('input[name=preferred_response_method][value=Email]').locator('..').click();
  await page.locator('form button[type=submit]').click();
  await page.waitForURL('**/contact/thank-you');
  assert.equal(submitted,true);
  console.log('PASS: external scripts blocked before consent, category isolation, withdrawal/reload, marketing opt-in, internal links');
  console.log('PASS: form validation and successful submission (API mocked; no email or real records)');
  await context.close();
} finally {await browser.close();}

