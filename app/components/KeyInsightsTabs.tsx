'use client';

import { Children, type KeyboardEvent, type ReactNode, useRef, useState } from 'react';

type KeyInsightsTabsProps={labels:string[];children:ReactNode};

export default function KeyInsightsTabs({labels,children}:KeyInsightsTabsProps){
  const panels=Children.toArray(children);const[active,setActive]=useState(0);const buttons=useRef<Array<HTMLButtonElement|null>>([]);
  const select=(index:number)=>{const next=(index+labels.length)%labels.length;setActive(next);buttons.current[next]?.focus();};
  const onKeyDown=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{if(event.key==='ArrowRight'){event.preventDefault();select(index+1);}else if(event.key==='ArrowLeft'){event.preventDefault();select(index-1);}else if(event.key==='Home'){event.preventDefault();select(0);}else if(event.key==='End'){event.preventDefault();select(labels.length-1);}};
  return <div className="key-insights-switcher">
    <div className="key-insight-tabs" role="tablist" aria-label="Five key insights">{labels.map((label,index)=><button key={label} ref={node=>{buttons.current[index]=node;}} type="button" role="tab" id={`insight-tab-${index+1}`} aria-controls={`insight-panel-${index+1}`} aria-label={`Go to insight: ${label}`} aria-selected={active===index} tabIndex={active===index?0:-1} className={active===index?'active':''} onClick={()=>setActive(index)} onKeyDown={event=>onKeyDown(event,index)}><span>{String(index+1).padStart(2,'0')}</span><b>{label}</b></button>)}</div>
    <div className="key-insight-panel" role="tabpanel" id={`insight-panel-${active+1}`} aria-labelledby={`insight-tab-${active+1}`} tabIndex={0} key={active}>{panels[active]}</div>
  </div>;
}
