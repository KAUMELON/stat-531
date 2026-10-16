from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[2]
base=root/'teaching-platform'
learning=json.loads((base/'functions/content/learning.json').read_text(encoding='utf-8'))
assert len(learning['chapters'])==14
ids=set();counts={}
for c in learning['chapters']:
 source=(root/c['source']).read_text(encoding='utf-8')
 expected=len(re.findall(r'^```(?:\{r(?:\s|\})|r\s*$)',source,re.M))
 actual=sum(s['kind']=='code' for s in c['steps'])
 assert actual==expected,(c['id'],expected,actual)
 for step in c['steps']:
  assert step['id'] not in ids,step['id']
  ids.add(step['id']);counts[step['kind']]=counts.get(step['kind'],0)+1
  if step['kind']=='check':assert 0<=step['answer']<len(step['options'])
 assert sum(s['kind']=='challenge' for s in c['steps'])==1
 assert sum(s['kind']=='assessment' for s in c['steps'])==1
assert counts['check']==70
assert counts['explore']==5
hosting=json.loads((base/'firebase.json').read_text(encoding='utf-8'))['hosting']
for name in ['course.json','practice.json','books/**','audio/**','decks/**']:assert name in hosting['ignore']
report={'chapters':14,'activities':len(ids),'types':counts,'all_original_R_blocks_retained':True,'public_content_excluded':True}
(base/'qa/learning-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
