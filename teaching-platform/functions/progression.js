function cleared(record){return record?.passed===true||(Number.isInteger(record?.score)&&record.total>0&&record.score===record.total);}
function unlockedIds(chapters,records){const ids=[];for(const chapter of chapters){ids.push(chapter.id);if(!cleared(records[chapter.id]))break;}return ids;}
function csvCell(value){let text=String(value??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
module.exports={cleared,unlockedIds,csvCell};
