"""Keep every chapter's prose and R examples in a protected, paced learning path."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[2]
dest=root/'teaching-platform/functions/content'
course=json.loads((dest/'course.json').read_text(encoding='utf-8'))
bank=json.loads((dest/'questions.json').read_text(encoding='utf-8'))
concepts=json.loads((dest/'concept-checks.json').read_text(encoding='utf-8'))
# Deterministic practical exercises; results are formative, never official grades.
labs=[
('Your first harvest','Create yield with values 3, 4, 5. Store its mean in average_yield. Print it.', 'yield <- c(3, 4, 5)\naverage_yield <- # complete this line\n', 'exists("average_yield") && isTRUE(all.equal(average_yield, 4))','A vector holds the observations; mean() summarizes them.'),
('Select a soil sample','Create soil_pH with values 5.5, 6.2, 7.0. Store the second value in sample_two.','soil_pH <- c(5.5, 6.2, 7.0)\nsample_two <- # select the second element\n','exists("sample_two") && isTRUE(all.equal(sample_two, 6.2))','R starts indexing at 1. Use square brackets.'),
('Export a field record','Make field with plot 1:3 and yield 3, 4, 5. Export field.csv without row names.','field <- data.frame(plot = 1:3, yield = c(3,4,5))\n# Use write.csv() to export field.csv\n','file.exists("field.csv") && identical(names(read.csv("field.csv")), c("plot", "yield")) && nrow(read.csv("field.csv")) == 3','Use row.names = FALSE. Files here belong to this browser R session.'),
('Missing soil values','Create nitrogen = c(20, NA, 40). Save the mean of observed values as mean_n.','nitrogen <- c(20, NA, 40)\nmean_n <- # handle the missing value\n','exists("mean_n") && isTRUE(all.equal(mean_n, 30))','Most summaries propagate NA unless you explicitly remove missing values.'),
('Compare treatment means','Use the supplied data. Store treatment means in treatment_means, with names A and B.','field <- data.frame(treatment=c("A","A","B","B"), yield=c(3,5,6,8))\n# Use tapply() or a grouped calculation\n','exists("treatment_means") && isTRUE(all.equal(as.numeric(treatment_means[c("A","B")]), c(4,7)))','tapply(field$yield, field$treatment, mean) groups observations before summarizing.'),
('Make the relationship visible','Make a scatter plot of rain on the x axis and yield on the y axis. Set correlation to their Pearson correlation.','rain <- c(80,100,120,140)\nyield <- c(2,3,4,5)\n# Draw the plot, then calculate correlation\n','exists("correlation") && isTRUE(all.equal(correlation,1))','plot(rain, yield) draws the scatter plot; cor() computes correlation. The numeric check tests correlation, not visual quality.'),
('Describe a harvest','For yield = c(2,4,4,6), store its mean as mean_yield and sample variance as variance_yield.','yield <- c(2,4,4,6)\n# Define mean_yield and variance_yield\n','exists("mean_yield") && exists("variance_yield") && isTRUE(all.equal(mean_yield,4)) && isTRUE(all.equal(variance_yield,8/3))','R var() uses the sample variance denominator n - 1.'),
('Inspect before modelling','For the supplied crop data, store complete cases as clean_crop and the number removed as removed.','crop <- data.frame(rain=c(80,100,NA,140), yield=c(2,3,4,5))\n# Define clean_crop and removed\n','exists("clean_crop") && exists("removed") && nrow(clean_crop)==3 && removed==1 && all(complete.cases(clean_crop))','complete.cases(crop) identifies rows without missing values. Deletion still needs scientific justification.'),
('The logistic midpoint','For A=100, k=0.3, t0=10, calculate biomass at t=10. Save it as midpoint.','A <- 100; k <- 0.3; t0 <- 10; t <- 10\nmidpoint <- # logistic curve\n','exists("midpoint") && isTRUE(all.equal(midpoint,50))','Use A / (1 + exp(-k * (t - t0))). At the inflection, this is A/2.'),
('Build a monthly series','Convert values 1:24 to an R ts object named rainfall_ts, starting January 2024 with annual seasonality.','values <- 1:24\nrainfall_ts <- # use ts()\n','exists("rainfall_ts") && is.ts(rainfall_ts) && frequency(rainfall_ts)==12 && identical(as.numeric(start(rainfall_ts)),c(2024,1))','There are 12 monthly observations in a year. Use start = c(2024,1).'),
('A paired comparison','Run a paired t-test on before and after. Save the result as paired_test.','before <- c(12,15,11,18,16)\nafter <- c(10,11,10,14,13)\n# Define paired_test\n','exists("paired_test") && inherits(paired_test,"htest") && grepl("Paired",paired_test$method)','Use t.test(before, after, paired = TRUE). The pairing must follow the design.'),
('Respect the blocks','Fit yield ~ treatment + block using aov(). Save the model as trial_model.','trial <- data.frame(yield=c(3,4,5,7,4,6), treatment=factor(rep(c("A","B"),3)), block=factor(rep(1:3,each=2)))\n# Define trial_model\n','exists("trial_model") && inherits(trial_model,"aov") && all(c("treatment","block") %in% attr(terms(trial_model),"term.labels"))','An RCBD model includes both treatment and block effects.'),
('Fit and interpret a slope','Fit yield on rain with lm(), save yield_model, and save its rain slope as rain_slope.','field <- data.frame(rain=c(80,100,120,140), yield=c(2,3,4,5))\n# Define yield_model and rain_slope\n','exists("yield_model") && exists("rain_slope") && inherits(yield_model,"lm") && isTRUE(all.equal(as.numeric(rain_slope),0.05))','lm(yield ~ rain, data=field) fits the line. coef() retrieves coefficients.'),
('A reproducible result','Set seed 42. Create simulated_yield from rnorm(5, mean=4, sd=0.2), and summary_yield from mean(simulated_yield).','# Set a seed, simulate five values, and save their mean\n','exists("simulated_yield") && exists("summary_yield") && length(simulated_yield)==5 && isTRUE(all.equal(summary_yield,mean(simulated_yield)))','set.seed() makes random examples repeatable. A mean alone does not establish reproducibility; retain the complete script.')
]
chapters=[]
explorers={
 '06':{'title':'What happens when rainfall increases?','body':'Explore a simulated rain–yield relationship. Change the slope, predict how the scatter plot changes, then run the simulation. These are teaching data, not field observations.','parameter':'Yield response per mm of rain','min':0,'max':0.08,'value':0.03,'increment':0.005,'template':'set.seed(42)\nrain <- seq(60,160,length.out=30)\nyield <- 1 + @VALUE@ * rain + rnorm(30,0,0.3)\nplot(rain,yield,pch=19,col="#8054df",xlab="Rain (mm)",ylab="Simulated yield (t/ha)")\nabline(lm(yield ~ rain),col="#1b9b70",lwd=3)'},
 '07':{'title':'One unusual yield: what changes?','body':'Adjust the last observation. Compare the mean and median. Explain which summary moves more and why. This is a simulated sensitivity experiment.','parameter':'Last plot yield (t/ha)','min':4,'max':40,'value':6,'increment':1,'template':'yield <- c(3,4,4,5,@VALUE@)\nprint(c(mean=mean(yield),median=median(yield)))\nbarplot(yield,col=c(rep("#a48ad9",4),"#e8aa61"),ylab="Simulated yield (t/ha)",names.arg=1:5)\nabline(h=mean(yield),col="#8054df",lwd=2)\nabline(h=median(yield),col="#1b9b70",lwd=2,lty=2)'},
 '09':{'title':'Make a growth curve your own','body':'Explore the logistic growth-rate parameter k. Keep the asymptote at 100 and the inflection time at 10. Does changing k move the inflection or change the steepness? These are model curves, not measured growth.','parameter':'Logistic growth rate k','min':0.05,'max':1,'value':0.3,'increment':0.05,'template':'time <- seq(0,20,length.out=200)\nbiomass <- 100/(1+exp(-@VALUE@*(time-10)))\nplot(time,biomass,type="l",lwd=3,col="#8054df",xlab="Time",ylab="Model biomass",ylim=c(0,100))\nabline(h=50,v=10,lty=2,col="#1b9b70")'},
 '10':{'title':'Reveal a seasonal signal','body':'Change the seasonal amplitude while keeping the trend and random seed fixed. Which part of the pattern repeats? Distinguish the model signal from the simulated noise.','parameter':'Seasonal amplitude','min':0,'max':40,'value':15,'increment':5,'template':'set.seed(42)\nmonth <- 1:60\nrain <- 70+0.15*month+@VALUE@*sin(2*pi*month/12)+rnorm(60,0,4)\nrainfall <- ts(rain,start=c(2020,1),frequency=12)\nplot(rainfall,col="#8054df",lwd=2,ylab="Simulated rainfall (mm)")'},
 '13':{'title':'Watch uncertainty change','body':'Increase the noise around a simulated linear relationship. Inspect the fitted slope and its confidence interval. A single sample is not proof of a general causal relationship.','parameter':'Noise standard deviation','min':0.1,'max':3,'value':0.5,'increment':0.1,'template':'set.seed(42)\nrain <- seq(50,150,length.out=35)\nyield <- 1+0.03*rain+rnorm(35,0,@VALUE@)\nmodel <- lm(yield ~ rain)\nprint(coef(model))\nprint(confint(model))\nplot(rain,yield,pch=19,col="#8054df",xlab="Rain (mm)",ylab="Simulated yield (t/ha)")\nabline(model,col="#1b9b70",lwd=3)'}
}
for index,(p,c) in enumerate(zip(sorted(root.glob('[0-9][0-9]-*.qmd')),course['chapters'])):
 text=p.read_text(encoding='utf-8');steps=[];topic=c['title'];buffer=[];code_mode=False;fence='';code=[]
 def add(kind,**data): steps.append({'id':f'{c["id"]}-{len(steps):04}','kind':kind,**data})
 def flush():
  if buffer:
   body='\n\n'.join(buffer).strip();buffer.clear()
   if body:add('learn',title=topic,body=body)
 # Split paragraphs, not sentences: preserve complete author explanations.
 prose=[]
 def paragraphs(lines):
  for paragraph in re.split(r'\n\s*\n','\n'.join(lines)):
   paragraph=paragraph.strip()
   if not paragraph:continue
   if sum(len(x.split()) for x in buffer)+len(paragraph.split())>170:flush()
   buffer.append(paragraph)
 def r_example(lines):
  body='\n'.join(x for x in lines if not x.startswith('#|')).strip()
  if body:add('code',title=topic,body='Read the code, predict its result, then load it into the R workspace. Some desktop installation and file examples require adaptation to this browser session.',code=body)
 for line in text.splitlines():
  if code_mode:
   fence_length=len(re.match(r'^`+',fence).group())
   if re.match(r'^`{'+str(fence_length)+r',}\s*$',line):
    if re.match(r'```(?:\{r(?:\s|\})|r\s*$)',fence):r_example(code)
    elif code:
     body='\n'.join(code)
     add('learn',title=topic,body=fence+'\n'+body+'\n'+'`'*fence_length)
     for nested in re.finditer(r'^```(?:\{r[^\n]*\}|r)\s*\n(.*?)^```\s*$',body,re.M|re.S):r_example(nested.group(1).splitlines())
    code_mode=False
   else:code.append(line)
   continue
  if line.startswith('```'):
   paragraphs(prose);prose=[];flush();code_mode=True;fence=line;code=[];continue
  if line.startswith('#'):
   m=re.match(r'^#{1,6}\s+(.+)',line)
   if m:
    paragraphs(prose);prose=[];flush();topic=re.sub(r'\s*\{[^}]*\}','',m.group(1));continue
  if line.strip().startswith(':::') or re.match(r'^<(/?)(script|style)',line.strip()):continue
  prose.append(line)
 paragraphs(prose);flush()
 # Distribute original, reviewed checkpoint questions through the chapter.
 original=steps;steps=[];questions=list(bank['chapters'][c['id']])
 for qi,(prompt,correct,wrong1,wrong2,explanation) in enumerate(concepts[c['id']]):
  options=[correct,wrong1,wrong2];shift=(index+qi)%3;options=options[shift:]+options[:shift]
  questions.append({'id':f'{c["id"]}-concept-{qi}','prompt':prompt,'options':options,'answer':options.index(correct),'explanation':explanation})
 positions={round((i+1)*len(original)/(len(questions)+1)):q for i,q in enumerate(questions)}
 for i,step in enumerate(original):
  step['id']=f'{c["id"]}-source-{i:04}';steps.append(step)
  if i+1 in positions:steps.append({'id':f'{c["id"]}-check-{i:04}','kind':'check',**positions[i+1]})
 if c['id'] in explorers:steps.insert(len(steps)//2,{'id':f'{c["id"]}-explore','kind':'explore',**explorers[c['id']]})
 title,task,starter,test,hint=labs[index]
 steps.append({'id':f'{c["id"]}-lab','kind':'challenge','title':title,'body':task,'code':starter,'test':test,'hint':hint})
 steps.append({'id':f'{c["id"]}-reflect','kind':'reflect','title':'Explain it in your own words','body':'What did you learn? Explain one result in its agricultural context and name an assumption or limitation. Ask STAT MAASH to review your explanation before you move on.'})
 steps.append({'id':f'{c["id"]}-assessment','kind':'assessment','title':'Your chapter checkpoint','body':'Complete this short server-marked check. You can revisit the chapter and retry. These are practice marks; the final examination is separate.','questions':bank['chapters'][c['id']]})
 chapters.append({'id':c['id'],'title':c['title'],'source':p.name,'steps':steps})
result={'version':1,'chapters':chapters}
(dest/'learning.json').write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'chapters':len(chapters),'activities':sum(len(c['steps']) for c in chapters),'checks':sum(s['kind']=='check' for c in chapters for s in c['steps']),'coding_challenges':len(labs)}))
