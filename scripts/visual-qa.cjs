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
          const cardImages=[...document.querySelectorAll(".floreix-service-card .elementor-widget-image img")].map(img=>{
            const s=getComputedStyle(img),r=img.getBoundingClientRect();
            return {width:Math.round(r.width),height:Math.round(r.height),objectFit:s.objectFit,objectPosition:s.objectPosition};
          });
          return {pageWidth:document.documentElement.scrollWidth,viewportWidth:window.innerWidth,
            hOverflow:Math.max(0,document.documentElement.scrollWidth-window.innerWidth),
            localImages:localImages.length,bad,badCount:bad.length,incomplete,cardImages};
        });
        const fileName=label+"-"+vp.name+".png";
        await page.screenshot({path:path.join("visual-qa-report",fileName),fullPage:true,animations:"disabled"});
        findings.push({url,label,viewport:vp.name,httpStatus:response?.status()||null,...info,requestErrors:errors.slice(0,30)});
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
    broken:f.badCount,horizontalOverflow:f.hOverflow,failedResources:f.requestErrors?.length||0,error:f.error
  }))));
  const failures=findings.filter(f=>f.error||f.httpStatus!==200||(f.badCount||0)>0||(f.hOverflow||0)>12||(f.incomplete||[]).length>0);
  if(failures.length) {
    console.error("VISUAL_QA_FAILURES "+JSON.stringify(failures.map(f=>({
      page:f.label,viewport:f.viewport,broken:f.bad,overflow:f.hOverflow,error:f.error,incomplete:f.incomplete
    }))));
    process.exitCode=1;
  }
})().catch(e=>{console.error(e);process.exitCode=1});
