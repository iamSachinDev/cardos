export default function LineChart({ data }:{ data:{label:string,value:number}[] }) {
  if (!data.length) return <div className="empty">Import statements to unlock your spending trend.</div>;
  const w=800,h=220,p=20; const max=Math.max(...data.map(x=>x.value),1); const min=Math.min(...data.map(x=>x.value),0); const span=Math.max(max-min,1);
  const pts=data.map((d,i)=>({x:p+(i*(w-p*2))/Math.max(data.length-1,1),y:h-p-((d.value-min)/span)*(h-p*2)}));
  const line=pts.map((q,i)=>`${i?'L':'M'} ${q.x} ${q.y}`).join(' ');
  const area=`${line} L ${pts.at(-1)?.x ?? w-p} ${h-p} L ${pts[0]?.x ?? p} ${h-p} Z`;
  return <div className="chart-box"><svg className="spark-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
    {[.25,.5,.75].map(v=><line key={v} className="chart-grid-line" x1={p} x2={w-p} y1={h*v} y2={h*v}/>) }
    <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8b5cf6" stopOpacity=".30"/><stop offset="1" stopColor="#22d3ee" stopOpacity=".02"/></linearGradient><linearGradient id="line" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs>
    <path d={area} fill="url(#area)"/><path d={line} fill="none" stroke="url(#line)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    {pts.map((q,i)=><circle key={i} cx={q.x} cy={q.y} r="5" fill="#10131b" stroke="#a78bfa" strokeWidth="3"/>)}
  </svg></div>;
}
