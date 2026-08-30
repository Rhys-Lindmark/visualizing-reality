'use client';

import { useMemo, useState } from 'react';

type Status = 'research' | 'draft' | 'reviewed';
type AtlasPage = { number: string; title: string; years: string; era: string; region: string; system: string; status: Status; progress: string; thesis: string; href?: string };

const pages: AtlasPage[] = [
  { number:'01', title:'Rome', years:'500 BCE–476 CE', era:'Iron Age', region:'Mediterranean', system:'States', status:'draft', progress:'5 of 5 live', thesis:'How an Italian coalition became a continental state—and why the Roman state survived its western court.', href:'/rome'},
  { number:'02', title:'Uruk and the first states', years:'7000–2900 BCE', era:'First cities', region:'Mesopotamia', system:'States', status:'reviewed', progress:'5 of 5 live', thesis:'Water, grain, writing, and organized labor made people and landscapes newly legible—without making control complete.', href:'/uruk' },
  { number:'03', title:'The cradles of civilization', years:'4000 BCE–1550 CE', era:'First cities', region:'Global', system:'Ecology', status:'reviewed', progress:'5 of 5 live', thesis:'Cities, states, monuments, notation, coordination, and collapse followed different clocks and pathways.', href:'/cradles' },
  { number:'04', title:'The Bronze Age world system', years:'3300–1200 BCE', era:'Bronze Age', region:'Mediterranean', system:'Trade', status:'draft', progress:'2 of 5 live', thesis:'Tin, selective palace institutions, chariots, and ships connected distant societies into a fragile system.', href:'/bronze-age' },
  { number:'05', title:'The Iron Age transformation', years:'1200–500 BCE', era:'Iron Age', region:'Eurasia', system:'Technology', status:'research', progress:'five claims scoped', thesis:'Iron mattered through institutions, fuel, skills, armies, and exchange—not as a magic metal.' },
  { number:'06', title:'Persia and territorial empire', years:'550–330 BCE', era:'Iron Age', region:'Eurasia', system:'States', status:'research', progress:'page queued', thesis:'Roads, satrapies, tribute, and negotiated rule made a new scale of empire possible.' },
  { number:'07', title:'Qin and Han China', years:'475 BCE–220 CE', era:'Classical', region:'East Asia', system:'States', status:'research', progress:'page queued', thesis:'Competition, standardization, logistics, and legibility built an enduring imperial repertoire.' },
  { number:'08', title:'India from cities to empires', years:'2600 BCE–550 CE', era:'Classical', region:'South Asia', system:'Trade', status:'research', progress:'page queued', thesis:'Monsoon ecologies, cities, states, religions, and trade moved on overlapping geographies.' },
  { number:'09', title:'Steppe, horse, and mobile power', years:'3500 BCE–1500 CE', era:'Long duration', region:'Eurasia', system:'War', status:'research', progress:'page queued', thesis:'Mobility was an adaptation that repeatedly changed agrarian states, trade, and warfare.' },
  { number:'10', title:'Christianity as infrastructure', years:'30–800 CE', era:'Late Antiquity', region:'Mediterranean', system:'Belief', status:'research', progress:'page queued', thesis:'Texts, cities, bishops, ritual, and charity made institutions that outlasted western empire.' },
  { number:'11', title:'The caliphates', years:'610–1258 CE', era:'Medieval', region:'Afro-Eurasia', system:'States', status:'research', progress:'page queued', thesis:'Conquest, inherited administrations, Arabic, law, and trade made a connected imperial sphere.' },
];

const filterValues = { era:['All','First cities','Bronze Age','Iron Age','Classical','Late Antiquity','Medieval','Long duration'], region:['All','Global','Mesopotamia','Mediterranean','Eurasia','East Asia','South Asia','Afro-Eurasia'], system:['All','States','Ecology','Trade','Technology','War','Belief'] } as const;

export default function AtlasExplorer(){
  const [dimension,setDimension]=useState<keyof typeof filterValues>('era');
  const [filter,setFilter]=useState('All');
  const visible=useMemo(()=>pages.filter(page=>filter==='All'||page[dimension]===filter),[dimension,filter]);
  const chooseDimension=(value:keyof typeof filterValues)=>{setDimension(value);setFilter('All');};
  return <section className="atlas" id="atlas">
    <div className="atlas-heading"><div><p className="topic-label">The atlas</p><h2>History as systems<br/>you can see.</h2></div><p>Pages are published as their evidence and visuals become strong enough. <b>Draft</b> pages contain live, auditable work; <b>research</b> pages show the committed sequence.</p></div>
    <div className="atlas-controls" aria-label="Filter atlas pages"><div className="dimension-tabs">{(['era','region','system'] as const).map(value=><button type="button" className={dimension===value?'active':''} onClick={()=>chooseDimension(value)} key={value}>By {value}</button>)}</div><div className="filter-tabs">{filterValues[dimension].map(value=><button type="button" className={filter===value?'active':''} onClick={()=>setFilter(value)} key={value}>{value}</button>)}</div></div>
    <div className="atlas-count"><b>{visible.length}</b> {visible.length===1?'page':'pages'} in this view</div>
    <div className="atlas-grid">{visible.map(page=>{
      const content=<><div className="card-top"><span>{page.number}</span><i className={`status status-${page.status}`}>{page.status}</i></div><p className="card-years">{page.years}</p><h3>{page.title}</h3><p className="card-thesis">{page.thesis}</p><div className="card-meta"><span>{page.era}</span><span>{page.region}</span><span>{page.system}</span></div><div className="card-progress">{page.progress}<b>{page.href?'Read the page →':'In the research queue'}</b></div></>;
      return page.href?<a className="atlas-card live" href={page.href} key={page.number}>{content}</a>:<article className="atlas-card" key={page.number}>{content}</article>;
    })}</div>
  </section>;
}
