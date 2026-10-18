// Calendar dates intentionally use the device's local timezone.
export function localDate(date=new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validDay(value) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(value+'T12:00:00');
  return Number.isFinite(d.getTime())&&localDate(d)===value&&value>='1900-01-01';
}
export function initializeProfile(state,now=new Date()) {
  const p=state.profile;
  state.weightHistory??=[];
  if(!p.startDate){
    p.startDate=localDate(now);
    p.startingWeight=p.weight;
    if(!state.weightHistory.length&&p.weight>=20&&p.weight<=400)state.weightHistory.push({id:'weight-'+p.startDate,date:p.startDate,weight:p.weight});
  }
  p.startingWeight??=p.weight;
  p.weight=currentWeight(state);
  return state;
}
export function currentWeight(state) {
  return [...(state.weightHistory||[])].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))[0]?.weight??state.profile.weight;
}
export function recordWeight(state,date,weight,now=new Date()) {
  if(!validDay(date)||date>localDate(now)||!Number.isFinite(weight)||weight<20||weight>400)throw Error('Укажи вес от 20 до 400 кг и дату не позже сегодняшней');
  initializeProfile(state,now);
  const old=state.weightHistory.find(r=>r.date===date);
  if(old)old.weight=weight;
  else state.weightHistory.push({id:'weight-'+date,date,weight});
  state.profile.weight=currentWeight(state);
}
export function weightAnalysis(state,period='quarter',now=new Date()) {
  const start=new Date(now);start.setHours(0,0,0,0);
  if(period==='month')start.setDate(start.getDate()-29);
  else if(period==='quarter')start.setDate(start.getDate()-89);
  const records=[...(state.weightHistory||[])].filter(r=>r.date<=localDate(now)&&(period==='all'||r.date>=localDate(start))).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  return {records,delta:records.length>=2?records.at(-1).weight-records[0].weight:null};
}
export function scheduleStatus(state,now=new Date()) {
  const p=state.profile,days=p.trainingDays||[];
  const base={missed:0,penalty:Math.min(state.xp,p.scheduleDebt||0),charged:p.chargedWorkouts||[],message:days.includes(now.getDay())?'Сегодня тренировочный день. Готов начать?':'Сегодня можно восстановиться.'};
  if(!days.length)return {...base,message:'Выбери дни тренировок в профиле.'};
  if(!validDay(p.scheduleStart))return {...base,message:'Закрепи выбранные дни в профиле, чтобы начать учёт пропусков.'};
  const today=localDate(now),byDay=new Map();
  for(const w of state.history){const day=localDate(new Date(w.date));if(!byDay.has(day))byDay.set(day,[]);byDay.get(day).push(w);}
  const charged=new Set(p.chargedWorkouts||[]);let missed=0,penalty=p.scheduleDebt||0;
  // Begin at schedule confirmation; never count today's session as missed.
  for(const d=new Date(p.scheduleStart+'T12:00:00');localDate(d)<today;d.setDate(d.getDate()+1)){
    const day=localDate(d);
    if(byDay.has(day)){missed=0;continue;}
    if(!days.includes(d.getDay()))continue;
    missed++;
    if(missed%3===0){
      const candidates=state.history.filter(w=>localDate(new Date(w.date))<day).sort((a,b)=>new Date(b.date)-new Date(a.date)||a.id.localeCompare(b.id)).slice(0,2);
      for(const w of candidates)if(!charged.has(w.id)){charged.add(w.id);penalty+=w.xp;}
    }
  }
  // A completed session today ends the current missed-session streak.
  if(byDay.has(today))missed=0;
  let message=base.message;
  if(missed===1)message='Одна тренировка пропущена. Вернись к занятиям в удобном темпе.';
  else if(missed===2)message='Пропущены две тренировки подряд. Следующий пропуск может уменьшить игровой XP.';
  else if(missed>=3)message=`Пропущено тренировок подряд: ${missed}. Удержано ${penalty} игрового XP. История тренировок сохранена.`;
  return {missed,penalty:Math.min(state.xp,penalty),charged:[...charged],message};
}
export const effectiveXP=(state,now=new Date())=>Math.max(0,state.xp-scheduleStatus(state,now).penalty);
export function bodyProgress(state,now=new Date()) {
  const xp=effectiveXP(state,now),level=Math.floor(xp/70)+1,start=Math.min(4,Math.max(0,Math.round((state.profile.body??50)/25))),gained=Math.floor((level-1)/5),stage=Math.min(4,start+gained);
  const nextLevel=stage<4?(gained+1)*5+1:null;
  return {xp,level,start,stage,nextLevel,remainingXP:nextLevel?Math.max(0,(nextLevel-1)*70-xp):0};
}
