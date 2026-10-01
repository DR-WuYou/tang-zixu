(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const scenes=[new ImagingScene($('#hero-canvas')),new ImagingScene($('#study-canvas'))];
  const study=scenes[1],motion=$('.motion-toggle'),menu=$('.menu-toggle'),mobile=$('#mobile-menu');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches;
  function setPaused(value){paused=value;document.body.classList.toggle('motion-paused',value);document.documentElement.classList.toggle('motion-paused',value);motion.setAttribute('aria-pressed',String(value));motion.setAttribute('aria-label',value?'继续动态效果':'暂停动态效果');$('.motion-symbol').textContent=value?'▷':'Ⅱ';$('.motion-label').textContent=value?'已暂停':'动效';scenes.forEach(scene=>scene.setPaused(value));}
  motion.addEventListener('click',()=>setPaused(!paused));reduced.addEventListener('change',e=>setPaused(e.matches));setPaused(paused);
  function setMenu(open){menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'收起导航':'展开导航');mobile.hidden=!open;}
  menu.addEventListener('click',()=>setMenu(mobile.hidden));mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobile.hidden){setMenu(false);menu.focus();}});
  document.addEventListener('click',e=>{if(!mobile.hidden&&!mobile.contains(e.target)&&!menu.contains(e.target))setMenu(false);});
  matchMedia('(min-width:601px)').addEventListener('change',e=>{if(e.matches)setMenu(false);});
  const descriptions=['先看到整体，再寻找其中的结构与联系。','拉开层间距离，观察整体如何由不同层次组成。','突出一个截面，移动观察位置，寻找形状的变化。'];
  function setMode(mode){document.querySelectorAll('.view-option').forEach(button=>{const active=Number(button.dataset.mode)===mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});$('#view-description').textContent=descriptions[mode];study.setMode(mode);}
  document.querySelectorAll('.view-option').forEach(button=>button.addEventListener('click',()=>setMode(Number(button.dataset.mode))));
  const range=$('#slice-range');
  function updateSlice(){const value=Number(range.value),label=value===0?'中部':`${value>0?'上部':'下部'} ${Math.round(Math.abs(value)/80*100)}%`;$('#slice-value').textContent=label;range.setAttribute('aria-valuetext',label);range.style.setProperty('--range-percent',`${(value+80)/160*100}%`);study.setSlice(value/100);}
  range.addEventListener('input',updateSlice);
  $('.reset-view').addEventListener('click',()=>{range.value='0';updateSlice();setMode(0);study.reset();});
  $('#copy-name').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('Tang Zixu');$('#copy-status').textContent='姓名已复制';}catch{$('#copy-status').textContent='请选中并复制：Tang Zixu';}});
  $('#year').textContent=new Date().getFullYear();
  const hero=$('.hero'),header=$('.site-header'),sections=[...document.querySelectorAll('main>section')],links=[...document.querySelectorAll('.desktop-nav a')];let pending=false;
  function updateScroll(){pending=false;const y=window.scrollY,progress=Math.min(1,y/hero.offsetHeight);hero.style.setProperty('--hero-progress',paused||reduced.matches?'0':String(progress));const current=sections.findLast(section=>section.getBoundingClientRect().top<=120)||hero;header.classList.toggle('on-paper',current.classList.contains('paper-section'));links.forEach(link=>{if(link.hash==='#'+current.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}
  window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateScroll);}},{passive:true});window.addEventListener('resize',updateScroll);updateScroll();
})();
