const {FieldValue,Timestamp,FieldPath}=require('firebase-admin/firestore');
function event(db,uid,type,details={},writer=db){
 const ref=db.collection(`students/${uid}/activity`).doc();
 const data={type,source:'server',...details,occurredAt:FieldValue.serverTimestamp()};
 return writer===db?ref.set(data):writer.set(ref,data);
}
function filters(input){
 if(!/^[a-zA-Z0-9_-]{1,128}$/.test(input.uid||''))throw Error('Choose a student.');
 const result={uid:input.uid};
 for(const key of ['from','to'])if(input[key]){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input[key])||!Number.isFinite(Date.parse(input[key]))||new Date(input[key]).toISOString().slice(0,10)!==input[key])throw Error('Choose valid dates.');
  result[key]=Date.parse(input[key]+'T00:00:00+05:30')+(key==='to'?86400000:0);
 }
 if(result.from&&result.to&&result.from>=result.to)throw Error('The end date must follow the start date.');
 if(input.cursor){if(!/^[A-Za-z0-9]{1,128}$/.test(input.cursor))throw Error('Invalid history cursor.');result.cursor=input.cursor;}
 return result;
}
async function history(db,input,csv=false){
 const f=filters(input),collection=db.collection(`students/${f.uid}/activity`);
 let query=collection.orderBy('occurredAt','desc').orderBy(FieldPath.documentId(),'desc');
 if(f.from)query=query.where('occurredAt','>=',Timestamp.fromMillis(f.from));
 if(f.to)query=query.where('occurredAt','<',Timestamp.fromMillis(f.to));
 if(f.cursor){const doc=await collection.doc(f.cursor).get();if(!doc.exists)throw Error('History cursor no longer exists.');query=query.startAfter(doc);}
 const limit=csv?5000:100,snapshot=await query.limit(limit+1).get();
 if(csv&&snapshot.docs.length>limit)throw Error('More than 5,000 events. Choose a smaller date range for this download.');
 const docs=snapshot.docs.slice(0,limit);
 return {events:docs.map(d=>({id:d.id,...d.data(),occurredAt:d.data().occurredAt?.toMillis()||null})),cursor:snapshot.docs.length>limit?docs.at(-1).id:null};
}
module.exports={event,filters,history};
