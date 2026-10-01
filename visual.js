/* Original parametric sculpture. Decorative geometry, not medical data. */
(() => {
  'use strict';
  const vertex = `
    attribute vec3 a_position;
    attribute float a_shell;
    uniform vec2 u_resolution;
    uniform vec2 u_rotation;
    uniform float u_time, u_mode, u_slice, u_dpr;
    varying vec4 v_color;
    void main(){
      vec3 p=a_position;
      float spread=1.0-abs(clamp(u_mode,0.0,2.0)-1.0);
      p.y*=1.0+spread*.56;
      float ry=u_rotation.y, rx=u_rotation.x;
      p.xz=mat2(cos(ry),-sin(ry),sin(ry),cos(ry))*p.xz;
      p.yz=mat2(cos(rx),-sin(rx),sin(rx),cos(rx))*p.yz;
      p.xy=mat2(.966,-.259,.259,.966)*p.xy;
      float perspective=3.7/(3.7-p.z);
      float aspect=u_resolution.y/u_resolution.x;
      float scale=.73*min(1.0,1.12/aspect)/(1.0+spread*.32);
      gl_Position=vec4(p.x*perspective*scale*aspect,p.y*perspective*scale,0.,1.);
      float front=smoothstep(-.9,1.1,p.z);
      float band=exp(-pow((a_position.y-u_slice)*17.,2.));
      float sliceMode=max(0.,u_mode-1.);
      float alpha=mix(.16,1.25,front)*mix(.48,1.,a_shell);
      alpha=mix(alpha,alpha*(.06+band*2.7),sliceMode);
      vec3 color=mix(vec3(.60,.25,.13),vec3(1.,.73,.45),front);
      color=mix(color,vec3(1.,.9,.73),band*.6);
      v_color=vec4(color,alpha);
      gl_PointSize=(1.6+front*.8+band*.5)*u_dpr*perspective;
    }`;
  const fragment = `precision mediump float; varying vec4 v_color;
    void main(){float d=length(gl_PointCoord-.5); if(d>.5)discard;
    gl_FragColor=vec4(v_color.rgb,v_color.a*(1.-smoothstep(.15,.5,d)));}`;
  function geometry(){
    const vertices=[];
    for(let shell=0;shell<4;shell++){
      const shellScale=1-shell*.18;
      for(let j=1;j<81;j++){
        const y=-1+j/40, ring=Math.sqrt(1-y*y);
        const points=320;
        for(let i=0;i<points;i++){
          const a=i/points*Math.PI*2;
          const wave=1+.08*Math.cos(a*3+y*3)+.035*Math.sin(a*5-y*4);
          const r=ring*wave*shellScale;
          vertices.push(r*Math.cos(a)*1.05,y*1.13*shellScale,r*Math.sin(a),shell===0?1:.3);
        }
      }
    }
    return new Float32Array(vertices);
  }
  const points=geometry();
  class ImagingScene {
    constructor(canvas){
      this.canvas=canvas; this.rotation=[-.2,.3]; this.mode=0; this.targetMode=0;
      this.slice=0; this.time=0; this.paused=false; this.visible=false; this.dragging=false; this.last=0;
      this.gl=canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power',premultipliedAlpha:false});
      if(this.gl){try{this.init();}catch(error){console.warn('Visual fallback:',error.message);this.gl=null;}}
      if(!this.gl){const replacement=canvas.cloneNode();canvas.replaceWith(replacement);this.canvas=replacement;this.ctx=replacement.getContext('2d');}
      this.canvas.dataset.renderer=this.gl?'webgl':'canvas2d';
      this.resizeObserver=new ResizeObserver(()=>{this.resize();this.draw();this.request();});this.resizeObserver.observe(this.canvas);
      this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible)this.request();else this.stop();});this.observer.observe(this.canvas);
      document.addEventListener('visibilitychange',()=>document.hidden?this.stop():this.request());
      this.bind(); this.resize(); this.draw();
    }
    init(){
      const g=this.gl;
      const shader=(type,source)=>{const s=g.createShader(type);g.shaderSource(s,source);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s;};
      this.program=g.createProgram();g.attachShader(this.program,shader(g.VERTEX_SHADER,vertex));g.attachShader(this.program,shader(g.FRAGMENT_SHADER,fragment));g.linkProgram(this.program);
      if(!g.getProgramParameter(this.program,g.LINK_STATUS))throw Error('Unable to link visual');
      g.useProgram(this.program);const buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buffer);g.bufferData(g.ARRAY_BUFFER,points,g.STATIC_DRAW);
      const pos=g.getAttribLocation(this.program,'a_position'),shell=g.getAttribLocation(this.program,'a_shell');
      g.enableVertexAttribArray(pos);g.vertexAttribPointer(pos,3,g.FLOAT,false,16,0);g.enableVertexAttribArray(shell);g.vertexAttribPointer(shell,1,g.FLOAT,false,16,12);
      this.uniforms={};for(const name of ['resolution','rotation','time','mode','slice','dpr'])this.uniforms[name]=g.getUniformLocation(this.program,'u_'+name);
      g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE);g.clearColor(0,0,0,0);
      this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.stop();this.lost=true;});
      this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.init();this.resize();this.draw();this.request();});
    }
    resize(){
      const rect=this.canvas.getBoundingClientRect();this.dpr=Math.min(window.devicePixelRatio||1,1.75);
      this.canvas.width=Math.max(1,Math.round(rect.width*this.dpr));this.canvas.height=Math.max(1,Math.round(rect.height*this.dpr));
      if(this.gl)this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
    }
    bind(){
      this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.dragging=true;this.previous=[e.clientX,e.clientY];this.canvas.setPointerCapture(e.pointerId);});
      this.canvas.addEventListener('pointermove',e=>{if(!this.dragging)return;this.rotation[1]+=(e.clientX-this.previous[0])*.007;this.rotation[0]=Math.max(-1.2,Math.min(1.2,this.rotation[0]+(e.clientY-this.previous[1])*.005));this.previous=[e.clientX,e.clientY];this.draw();});
      const release=()=>{this.dragging=false;};this.canvas.addEventListener('pointerup',release);this.canvas.addEventListener('pointercancel',release);
    }
    setMode(mode){this.targetMode=mode;this.canvas.dataset.mode=String(mode);if(this.paused)this.mode=mode;this.draw();this.request();}
    setSlice(value){this.slice=value;this.draw();}
    reset(){this.rotation=[-.2,.3];this.slice=0;this.setMode(0);}
    setPaused(value){this.paused=value;if(value){this.mode=this.targetMode;this.stop();this.draw();}else this.request();}
    stop(){cancelAnimationFrame(this.frame);this.frame=null;this.last=0;}
    request(){if(this.frame||!this.visible||document.hidden||this.lost||this.paused)return;this.frame=requestAnimationFrame(t=>this.tick(t));}
    tick(t){this.frame=null;if(this.paused||!this.visible||document.hidden||this.lost)return;
      const dt=this.last?Math.min((t-this.last)/1000,.05):.016;this.last=t;this.time+=dt;
      if(!this.dragging)this.rotation[1]+=dt*.08;
      this.mode+=(this.targetMode-this.mode)*Math.min(1,dt*6);this.draw();this.request();
    }
    draw(){
      if(this.lost)return;
      if(!this.gl){this.drawFallback();return;}
      const g=this.gl,u=this.uniforms;g.clear(g.COLOR_BUFFER_BIT);g.useProgram(this.program);
      g.uniform2f(u.resolution,this.canvas.width,this.canvas.height);g.uniform2f(u.rotation,...this.rotation);
      g.uniform1f(u.time,this.time);g.uniform1f(u.mode,this.mode);g.uniform1f(u.slice,this.slice);g.uniform1f(u.dpr,this.dpr);
      g.drawArrays(g.POINTS,0,points.length/4);
    }
    drawFallback(){
      const c=this.ctx;if(!c)return;const w=this.canvas.width,h=this.canvas.height,scale=Math.min(w,h)*.33;
      c.clearRect(0,0,w,h);c.save();c.translate(w/2,h/2);c.rotate(-.25);c.lineWidth=this.dpr*.65;
      for(let i=-30;i<=30;i++){const y=i/30;if(this.mode>1.5&&Math.abs(y-this.slice)>.09)continue;
        c.strokeStyle=`rgba(238,171,108,${.2+.5*(1-Math.abs(y))})`;c.beginPath();c.ellipse(0,y*scale*(this.mode>.5&&this.mode<1.5?1.45:1),Math.max(.1,Math.sqrt(1-y*y)*scale),scale*.2,0,0,Math.PI*2);c.stroke();}
      c.restore();
    }
  }
  window.ImagingScene=ImagingScene;
})();



