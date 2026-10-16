from pathlib import Path
import json, wave, zipfile
from xml.etree import ElementTree as ET

root=Path(__file__).resolve().parents[1]
public=root/'public'
course=json.loads((public/'course.json').read_text(encoding='utf-8'))
questions=json.loads((public/'practice.json').read_text(encoding='utf-8'))
errors=[]
assert len(course['chapters'])==14
slide_count=0; seconds=0
for c in course['chapters']:
    if len(c['objectives'])>700:errors.append(f'{c["id"]}: learning outcomes too long')
    for key in ['bookUrl','deckUrl']:
        if not (public/c[key]).is_file():errors.append(f'{c["id"]}: missing {key}')
    with zipfile.ZipFile(public/c['deckUrl']) as z:
        slides=[n for n in z.namelist() if __import__('re').match(r'ppt/slides/slide\d+\.xml$',n)]
        notes=[n for n in z.namelist() if __import__('re').match(r'ppt/notesSlides/notesSlide\d+\.xml$',n)]
        if len(slides)!=len(c['slides']) or len(notes)!=len(slides):errors.append(f'{c["id"]}: deck/notes count mismatch')
        for n in slides:ET.fromstring(z.read(n))
    for i,s in enumerate(c['slides'],1):
        clip=public/f'audio/chapter-{c["id"]}-{i}.wav'
        if not clip.exists():errors.append(f'Missing narration: {clip.name}');continue
        with wave.open(str(clip),'rb') as audio:
            duration=audio.getnframes()/audio.getframerate()
            seconds+=duration
            if duration<1:errors.append(f'Empty narration: {clip.name}')
        slide_count+=1
    for q in questions[c['id']]:
        if not 0<=q['answer']<len(q['options']):errors.append(f'Invalid answer: {q["id"]}')
if (public/'questions.json').exists() or (public/'functions').exists():errors.append('Private exam bank was copied into public hosting')
report={'chapters':len(course['chapters']),'slides':slide_count,'narration_minutes':round(seconds/60,1),'powerpoints':14,'practice_questions':sum(map(len,questions.values())),'errors':errors}
(root/'qa/platform-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2));raise SystemExit(bool(errors))
