"""Import the approved Quarto chapters without modifying the textbook."""
from pathlib import Path
import re, json, shutil

root = Path(__file__).resolve().parents[2]
out = root / 'teaching-platform/public'
out.mkdir(exist_ok=True)

def prose(text):
    text = re.sub(r'```.*?```', '', text, flags=re.S)
    text = re.sub(r'!\[[^]]*\]\([^)]*\)(\{[^}]*\})?', '', text)
    text = re.sub(r'\[([^]]*)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'\{[^}]*\}', '', text)
    return re.sub(r'\s+', ' ', re.sub(r'[#*`:$]', '', text)).strip()

chapters=[]
for i,p in enumerate(sorted(root.glob('[0-9][0-9]-*.qmd')),1):
    text=p.read_text(encoding='utf-8')
    title=prose(text.splitlines()[0])
    outcomes=re.search(r'## Learning outcomes\s+(.*?)(?=\n## )',text,re.S)
    objectives=prose(outcomes.group(1).strip().split('\n\n')[0]) if outcomes else ''
    sections=[]
    for match in re.finditer(r'^## (.*?)\n(.*?)(?=^## |\Z)',text,re.M|re.S):
        name=prose(match.group(1)); body=prose(match.group(2))
        if any(w in name.lower() for w in ['learning outcomes','practical','live r laboratory']): continue
        if body: sections.append({'title':name,'body':body[:1000]})
    lab=text.split('::: {.live-r}',1)[-1]
    code=re.search(r'```r\n(.*?)\n```',lab,re.S)
    code=code.group(1) if code else 'mean(c(3.2, 3.8, 4.1))'
    slides=[{'title':title,'body':objectives,'notes':f'Welcome to chapter {i}. {objectives}'}]
    for section in sections[:3]:
        body=section['body']; cut=body[:420]
        if len(body)>420: cut=cut.rsplit(' ',1)[0]+'…'
        slides.append({'title':section['title'],'body':cut,'notes':body[:900]})
    slides.append({'title':'A practical in R','code':code,'body':'Predict the result, run the example, then explain what changes when you edit one input.','notes':'Pause the lecture and try this code in the R laboratory. Read each instruction. Predict the result before you run it. Change one input and explain the effect on the output.'})
    slides.append({'title':'Your chapter checkpoint','body':'Explain the main idea in your own words. Complete the R practical. Answer the chapter questions, then revisit any topic you found difficult.','notes':f'You have reached the end of chapter {i}. Return to the book whenever you need more detail. Complete the practice questions and review their feedback before moving on.'})
    chapters.append({'id':str(i).zfill(2),'title':title,'number':i,'module':next(m for n,m in [(3,'Foundations'),(5,'Data wrangling'),(6,'Visualization'),(8,'Exploratory analysis'),(10,'Growth and time series'),(13,'Statistical analysis'),(14,'Reproducible research')] if i<=n),
      'objectives':objectives,'sections':sections,'context':prose(text)[:30000],
      'code':code,'slides':slides,'minutes':20+len(slides)*2,
      'bookUrl':f'books/r-agriculture/{p.stem}.html',
      'deckUrl':f'decks/chapter-{i:02}.pptx'})

course={'id':'r-agriculture','title':'R Programming for Agricultural Data Analysis',
 'subtitle':'An undergraduate textbook and practical companion',
 'author':'Dr. Pratheesh P. Gopinath','level':'Undergraduate','credits':'0+2',
 'description':'From your first R command to reproducible agricultural research. Learn through guided chapters, narrated slides, and hands-on R practicals.',
 'chapters':chapters,'status':'Teaching preview','version':'2026-10-16'}
(out/'course.json').write_text(json.dumps(course,ensure_ascii=False),encoding='utf-8')
private=root/'teaching-platform/functions/content'
private.mkdir(parents=True,exist_ok=True)
(private/'course.json').write_text(json.dumps(course,ensure_ascii=False),encoding='utf-8')
book=out/'books/r-agriculture'
book.mkdir(parents=True,exist_ok=True)
shutil.copytree(root/'_book',book,dirs_exist_ok=True)
print(f'Imported {len(chapters)} chapters and {sum(len(c["slides"]) for c in chapters)} lecture slides.')
