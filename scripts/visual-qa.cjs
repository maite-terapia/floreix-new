/* Automated desktop/mobile visual audit for Floreix GitHub Pages. */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const origin = "https://maite-terapia.github.io/floreix-new";
const pages = [
  ["/", "home"],
  ["/about/", "about"],
  ["/psicoterapia/", "psychotherapy"],
  ["/terapia-a-la-natura/", "nature"],
  ["/metodologia/", "methodology"],
  ["/contact/", "contact"],
  ["/es/", "home-es"],
  ["/es/contacto/", "contact-es"],
  ["/es/metodologia/", "methodology-es"],
  ["/es/psicoterapia/", "psychotherapy-es"],
  ["/es/sobre-nosotros/", "about-es"],
  ["/es/terapia-en-la-naturaleza/", "nature-es"],
  ["/privacy-policy/", "legal-ca"],
  ["/es/terminos-y-condiciones/", "legal-es"],
  ["/es/elementor-1816/", "legacy-es-redirect"],
];
const viewports = [
  {name:"desktop",width:1440,height:900},
  {name:"mobile",width:390,height:844}
];
(async()=>{
  fs.mkdirSync("visual-qa-report", {recursive:true});
  const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const findings=[];
  for(const vp of viewports) {
    const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
    for(const [url,label] of pages) {
      const page=await context.newPage();
      const errors=[];
      const jsErrors=[];
      page.on("pageerror", e=>jsErrors.push(String(e).slice(0,260)));
      page.on("response",response=>{
        if(response.status()>=400 && /\/assets\/media\/|\/wp-content\/|\/wp-includes\//.test(response.url())) {
          errors.push({status:response.status(),url:response.url()});
        }
      });
      try {
        const response=await page.goto(origin+url,{waitUntil:"domcontentloaded",timeout:45000});
        await page.waitForTimeout(1100);
        await page.evaluate(async()=>{
          for(const img of document.querySelectorAll("img[loading='lazy']")) img.loading="eager";
          await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
        });
        const info=await page.evaluate(()=>{
          const images=[...document.images].filter(img=>{
            const r=img.getBoundingClientRect(),s=getComputedStyle(img);
            return r.width>8&&r.height>8&&s.display!=="none"&&s.visibility!=="hidden";
          });
          const localImages=images.filter(img=>(img.currentSrc||img.src).includes("/assets/media/"));
          const bad=localImages.filter(img=>img.complete&&img.naturalWidth===0).map(img=>img.currentSrc||img.src);
          const incomplete=localImages.filter(img=>!img.complete).map(img=>img.currentSrc||img.src);
          const allBroken=images.filter(img=>img.complete&&img.naturalWidth===0).map(img=>img.currentSrc||img.src);
          const maps=[...document.querySelectorAll('iframe[src*="maps.google.com/maps"]')].map(iframe=>{
            const r=iframe.getBoundingClientRect();
            return {width:Math.round(r.width),height:Math.round(r.height),src:iframe.src};
          });
          const mapLinks=document.querySelectorAll(".floreix-map-link a[href]").length;
          const dummySocialVisible=[...document.querySelectorAll(".elementor-social-icon[href='#']")].filter(a=>a.getClientRects().length>0).length;
          const oldProjectLinks=[...document.querySelectorAll("a[href]")].filter(a=>a.getAttribute("href").includes("maite-terapia.github.io/floreix-new/")).length;
          const staleWpforms=[...document.querySelectorAll("script[src],link[href]")].filter(el=>/wpforms-lite|googlesitekit-events-provider-wpforms/.test(el.src||el.href)).length;
          const cardImages=[...document.querySelectorAll(".floreix-service-card .elementor-widget-image img")].map(img=>{
            const s=getComputedStyle(img),r=img.getBoundingClientRect();
            return {width:Math.round(r.width),height:Math.round(r.height),objectFit:s.objectFit,objectPosition:s.objectPosition};
          });
          return {pageWidth:document.documentElement.scrollWidth,viewportWidth:window.innerWidth,
            hOverflow:Math.max(0,document.documentElement.scrollWidth-window.innerWidth),
            localImages:localImages.length,bad,badCount:bad.length,incomplete,cardImages,
            allBroken,allBrokenCount:allBroken.length,maps,mapLinks,dummySocialVisible,oldProjectLinks,staleWpforms};
        });
        const fileName=label+"-"+vp.name+".png";
        await page.screenshot({path:path.join("visual-qa-report",fileName),fullPage:true,animations:"disabled"});
        findings.push({url,label,viewport:vp.name,httpStatus:response?.status()||null,...info,requestErrors:errors.slice(0,30),jsErrors:jsErrors.slice(0,20)});
      }catch(e) {
        findings.push({url,label,viewport:vp.name,error:String(e)});
      }finally {await page.close();}
    }
    await context.close();
  }
  await browser.close();
  fs.writeFileSync("visual-qa-report/report.json",JSON.stringify(findings,null,2));
  console.log("VISUAL_QA_REPORT "+JSON.stringify(findings.map(f=>({
    page:f.label,viewport:f.viewport,http:f.httpStatus,localImages:f.localImages,
    broken:f.badCount,brokenAll:f.allBrokenCount,horizontalOverflow:f.hOverflow,
    oldProjectLinks:f.oldProjectLinks,staleWpforms:f.staleWpforms,
    maps:f.maps?.length||0,mapLinks:f.mapLinks||0,dummySocialVisible:f.dummySocialVisible||0,
    jsErrors:f.jsErrors?.length||0,failedResources:f.requestErrors?.length||0,error:f.error
  }))));
  const failures=findings.filter(f=>f.error||f.httpStatus!==200||(f.badCount||0)>0||(f.allBrokenCount||0)>0||
    (f.hOverflow||0)>12||(f.incomplete||[]).length>0||(f.oldProjectLinks||0)>0||(f.staleWpforms||0)>0||
    ((f.label==="contact"||f.label==="contact-es")&&
       ((f.maps||[]).length!==2||f.mapLinks!==2||(f.dummySocialVisible||0)>0)));
  if(failures.length) {
    console.error("VISUAL_QA_FAILURES "+JSON.stringify(failures.map(f=>({
      page:f.label,viewport:f.viewport,broken:f.bad,overflow:f.hOverflow,error:f.error,incomplete:f.incomplete
    }))));
    process.exitCode=1;
  }
})().catch(e=>{console.error(e);process.exitCode=1});
