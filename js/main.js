(() => {
const $=id=>document.getElementById(id), canvas=$("map"),ctx=canvas.getContext("2d"),img=new Image();
img.src="assets/world-map-natural-earth.png";
let pool=[],i=0,right=0,tried=0,current=null,locked=false;
const norm=s=>s.toLowerCase().replace(/[\s　・･.,，。()（）]/g,"").replace(/[‐‑‒–—−]/g,"-");
function stats(){
  const shown = current ? Math.min(i+1,pool.length) : pool.length;
  $("progress").textContent=`${shown} / ${pool.length}`;
  $("correct").textContent=right;
  $("rate").textContent=`${tried?Math.round(right/tried*100):0}%`;
}
function project(lon,lat,q,w,h){
  const [west,east,south,north]=q.map;
  return {x:(lon-west)/(east-west)*w,y:(north-lat)/(north-south)*h};
}
function drawGeometry(q,w,h){
  if(!q.geometry || !Array.isArray(q.geometry.points)) return;
  const pts=q.geometry.points.map(([lon,lat])=>project(lon,lat,q,w,h));
  if(pts.length<2)return;
  ctx.save();
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  for(let k=1;k<pts.length;k++)ctx.lineTo(pts[k].x,pts[k].y);
  if(q.geometry.type==="polygon")ctx.closePath();
  if(q.geometry.type==="polygon"){
    ctx.fillStyle="rgba(238,145,45,.28)";ctx.fill();
    ctx.lineWidth=2.5;ctx.strokeStyle="#d87921";ctx.stroke();
  }else{
    ctx.lineWidth=4;ctx.lineCap="round";ctx.lineJoin="round";
    ctx.strokeStyle="#087eaa";ctx.stroke();
    ctx.lineWidth=1.5;ctx.strokeStyle="white";ctx.stroke();
  }
  ctx.restore();
}
function map(q){
  const [west,east,south,north]=q.map,ratio=(east-west)/(north-south);let w=1100,h=w/ratio;
  if(h>540){h=540;w=h*ratio;}
  canvas.width=Math.round(w);canvas.height=Math.round(h);
  if(!img.complete||!img.naturalWidth){$("mapMessage").textContent="assets/world-map-natural-earth.png が見つかりません。";return;}
  $("mapMessage").textContent="";
  const sx=(west+180)/360*img.naturalWidth,sy=(90-north)/180*img.naturalHeight,sw=(east-west)/360*img.naturalWidth,sh=(north-south)/180*img.naturalHeight;
  ctx.clearRect(0,0,w,h);ctx.drawImage(img,sx,sy,sw,sh,0,0,w,h);
  drawGeometry(q,w,h);
  const {x,y}=project(q.lon,q.lat,q,w,h);
  // 点は補助表示。線・面の対象では図形自体が主役になる。
  if(!q.geometry){
    ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fillStyle="#e34b36";ctx.fill();ctx.lineWidth=3;ctx.strokeStyle="white";ctx.stroke();
    ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.lineWidth=2;ctx.strokeStyle="#e34b36";ctx.stroke();
  }
}
function next(){
  if(i>=pool.length){
    $("question").textContent=`終了！ ${pool.length}問中 ${right}問正解でした。`;
    $("category").textContent="終了";$("answer").disabled=true;$("submit").disabled=true;$("next").disabled=true;$("showAnswer").disabled=true;
    current=null;locked=true;stats();return;
  }
  current=pool[i];locked=false;$("category").textContent=current.category;$("question").textContent=current.prompt;
  $("feedback").textContent="";$("feedback").className="feedback";$("answer").value="";$("answer").disabled=false;
  $("submit").disabled=false;$("next").disabled=true;$("showAnswer").disabled=false;map(current);$("answer").focus();stats();
}
function start(){
  const mode=$("mode").value;
  pool=window.QUESTIONS.filter(q=>mode==="all"||q.category===mode).sort(()=>Math.random()-.5);
  i=0;right=0;tried=0;current=null;locked=false;next();
}
$("answerForm").addEventListener("submit",e=>{
  e.preventDefault();if(locked||!current)return;
  tried++;const ok=current.answers.some(a=>norm(a)===norm($("answer").value.trim()));
  if(ok){
    right++;locked=true;$("feedback").textContent="正解！";$("feedback").className="feedback good";
    $("answer").disabled=true;$("submit").disabled=true;$("next").disabled=false;$("showAnswer").disabled=true;
  }else{
    $("feedback").textContent="不正解";$("feedback").className="feedback bad";
  }
  stats();
});
$("next").addEventListener("click",()=>{if(locked){i++;next();}});
$("showAnswer").addEventListener("click",()=>{
  if(locked||!current)return;tried++;locked=true;
  $("feedback").textContent=`正解：${current.answers[0]}`;$("answer").disabled=true;$("submit").disabled=true;
  $("next").disabled=false;$("showAnswer").disabled=true;stats();
});
$("restart").addEventListener("click",start);$("mode").addEventListener("change",start);
img.onload=()=>{if(current)map(current);};
img.onerror=()=>{$("mapMessage").textContent="地図画像を読み込めません。ファイル名と配置場所を確認してください。";};
start();
})();
