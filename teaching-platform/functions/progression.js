function cleared(record){return record?.passed===true||(Number.isInteger(record?.score)&&record.total>0&&record.score===record.total);}
function unlockedIds(chapters,records){const ids=[];for(const chapter of chapters){ids.push(chapter.id);if(!cleared(records[chapter.id]))break;}return ids;}
function csvCell(value){let text=String(value??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
function canAssess(progress,chapter,video){const ids=new Set(progress?.stepIds||[]),required=chapter?.steps.filter(s=>s.kind==='learn')||[];const read=progress?.readComplete===true||(required.length>0&&required.every(s=>ids.has(s.id)));return read&&(!video||progress?.videoComplete===true);}
module.exports={cleared,unlockedIds,csvCell,canAssess};
