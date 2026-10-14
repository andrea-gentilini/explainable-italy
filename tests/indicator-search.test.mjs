import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {createIndicatorSearch} from '../app/components/indicator-search.mjs';
const data=JSON.parse(readFileSync(new URL('../data/processed/dashboard.json',import.meta.url),'utf8'));
const search=createIndicatorSearch(data.indicators);
const top=query=>search(query).slice(0,3).map(i=>i.id);
test('everyday phrases find relevant indicators across languages',()=>{
  assert(top('quanto costa la sanita').includes('spending-health'));
  assert(top('raccolta differenziata').includes('municipal-waste-recycling'));
  assert(top('quanti giovani hanno una laurea').includes('tertiary-education'));
  assert(top('cost of living').includes('inflation'));
  assert.equal(top('how many money for pensions')[0],'pension-expenditure');
  assert.equal(top('how much money for pensions')[0],'pension-expenditure');
  assert.equal(top('quanti soldi per le pensioni')[0],'pension-expenditure');
  assert(top('how many children are born').includes('fertility-rate'));
  assert.equal(top('quanto spendiamo per le pensoni')[0],'pension-expenditure');
  assert.equal(top('how many young people cannot find a job')[0],'youth-unemployment');
  assert.equal(top('quanti ragazzi lasciano la scuola prima del diploma')[0],'early-school-leavers');
  assert.equal(top('come si confronta il PIL per persona con il resto dell Europa')[0],'gdp-per-capita-pps');
  assert.equal(top('how much energy comes from renewable sources')[0],'renewable-energy');
});
test('typos and accents preserve useful results',()=>{
  assert(top('disocupazione').includes('unemployment-rate'));
  assert(!search('pensoni').some(i=>i.id==='gdp-per-capita-pps'));
  assert.equal(top('pensoni')[0],'pension-expenditure');
  assert(top('sanità').includes('spending-health'));
  assert(top('rinnovab').includes('renewable-energy'));
});
test('empty search preserves catalogue order and topic filters',()=>{
  assert.deepEqual(search(''),data.indicators);
  assert(search('scuola','education').every(i=>i.section==='education'));
  assert.equal(search('scuola','people').length,0);
});
test('unavailable concepts and incidental partial matches are not forced',()=>{
  assert.equal(search('stipendio medio').length,0);
  assert.equal(search('money for salaries').length,0);
  assert.equal(search('affitto medio').length,0);
  assert.equal(search('stipendio medici').length,0);
  assert.equal(search('xyzqplm').length,0);
});
