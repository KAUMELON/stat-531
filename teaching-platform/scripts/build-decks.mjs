import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const course=JSON.parse(await fs.readFile(path.join(root,'public/course.json'),'utf8'));
const skill='C:/Users/user/.codex/plugins/cache/openai-primary-runtime/presentations/26.1013.11914/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
function text(slide,value,left,top,width,height,size,color='#234A3B',bold=false,font='Arial'){
 const shape=slide.shapes.add({geometry:'textbox',position:{left,top,width,height},fill:'none',line:{fill:'none',width:0}});
 shape.text=value;shape.text.style={typeface:font,fontSize:size,color,bold};return shape;
}
for(const chapter of course.chapters){
 const p=Presentation.create({slideSize:{width:1280,height:720}});
 for(const [i,s]of chapter.slides.entries()){
  const slide=p.slides.add();slide.background.fill=i===0?'#164B3E':'#F6F7F0';
  const ink=i===0?'#F6F7F0':'#234A3B';
  text(slide,`DEPARTMENT OF AGRICULTURAL STATISTICS`,70,45,1100,25,15,i===0?'#B9CCA8':'#75896A',true);
  text(slide,s.title,70,112,1120,145,44,ink,true);
  if(s.code){text(slide,s.code,70,270,1135,365,21,'#234A3B',false,'Consolas');}
  else text(slide,s.body,70,285,1080,300,28,i===0?'#D3DFC9':'#526849');
  text(slide,`R Programming for Agricultural Data Analysis     Chapter ${chapter.id}`,70,657,1040,25,13,i===0?'#B9CCA8':'#819174');
  text(slide,`${i+1} / ${chapter.slides.length}`,1160,657,70,25,13,i===0?'#B9CCA8':'#819174');
  slide.speakerNotes.text=`${s.notes||s.body}\n\nSource: Dr. Pratheesh P. Gopinath, ${course.title}, chapter ${chapter.id}, ${chapter.title}. Textbook teaching edition, 16 October 2026. Narration script, without embedded audio.`;
  const png=await p.export({slide,format:'png',scale:0.75});
  await fs.writeFile(path.join(root,`qa/slides/${chapter.id}-${i+1}.png`),new Uint8Array(await png.arrayBuffer()));
 }
 const candidatePath=path.join(root,`.build/chapter-${chapter.id}-draft.pptx`);
 await(await PresentationFile.exportPptx(p)).save(candidatePath);
 const finalPath=path.join(root,`public/decks/chapter-${chapter.id}.pptx`);
 await finalizePresentation({workspaceDir:root,candidatePath,finalPath,
  pythonExecutable:'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],
  explicitTotalSlideCount:chapter.slides.length,fontPolicy:{basis:'design',families:['Arial','Consolas']},
  verifyArtifactToolImport:true,receiptPath:path.join(root,`qa/chapter-${chapter.id}.validation.json`)});
 console.log(`Exported chapter ${chapter.id}: ${chapter.slides.length} slides`);
}
