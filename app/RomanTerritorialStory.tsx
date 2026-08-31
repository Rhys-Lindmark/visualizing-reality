'use client';

import { useState } from 'react';
import RomanGrowthComparison from './RomanGrowthComparison';
import RomanMap from './RomanMap';

export default function RomanTerritorialStory(){
  const[view,setView]=useState<'growth'|'map'>('growth');
  return <div className="roman-territorial-story"><nav aria-label="Choose a territorial view"><button type="button" className={view==='growth'?'active':''} onClick={()=>setView('growth')}>Compare growth</button><button type="button" className={view==='map'?'active':''} onClick={()=>setView('map')}>Explore the map</button></nav>{view==='growth'?<RomanGrowthComparison/>:<RomanMap/>}</div>;
}
