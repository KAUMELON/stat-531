from pathlib import Path
import json

# Authorable question banks. Final-exam answers never enter the Hosting directory.
practice = [
 [('What performs the calculations when you use RStudio?', ['R','The Plots pane','Quarto alone'],0,'R is the computing language and environment. RStudio is an IDE.'),('What does mean(c(3, 4, 5)) return?',['3','4','5'],1,'The sum is 12 and the number of observations is 3.')],
 [('Which object can store columns of different types?',['A numeric vector','A data frame','A single numeric matrix'],1,'A data frame can combine numeric, character, factor, and other column types.'),('What does x[2] select?',['The second element','All but the second element','The name of x'],0,'R uses one-based indexing.')],
 [('What should you check after importing a file?',['Only the file name','Column types, units, rows, and missing values','Only the first yield'],1,'Import success does not establish that types and observations were interpreted correctly.'),('Which argument removes row numbers when exporting CSV?',['row.names = FALSE','header = FALSE','na.rm = TRUE'],0,'write.csv(x, file, row.names = FALSE) omits the extra row-number column.')],
 [('A soil pH of 65 should first be…',['Deleted silently','Verified against the source record','Replaced with the overall mean'],1,'An implausible value requires verification. Its correct replacement cannot be inferred automatically.'),('Which expression identifies missing values in x?',['x == NA','is.na(x)','missing(x)'],1,'NA comparisons do not return the usual TRUE/FALSE result. is.na identifies missing entries.')],
 [('What does group_by(treatment) do before summarise()?',['Fits ANOVA','Defines treatment groups for subsequent operations','Randomizes the trial'],1,'Grouping changes how summary operations are applied; it does not perform inference.'),('Which dplyr verb selects rows by a condition?',['filter','select','rename'],0,'filter selects rows; select chooses columns.')],
 [('Which plot shows a relationship between two quantitative variables?',['Scatter plot','Pie chart','A single frequency label'],0,'A scatter plot displays paired numeric observations.'),('What should a yield axis label include?',['Only the colour name','The variable and its units','The p-value instead of units'],1,'A label such as Yield (t/ha) supports correct interpretation.')],
 [('What are the units of variance when yield is in t/ha?',['t/ha','(t/ha) squared','No units'],1,'Variance averages squared deviations. SD returns to the original measurement units.'),('Which measure is usually less sensitive to one extreme observation?',['Mean','Median','Range'],1,'The median depends on order and is less affected by the magnitude of an extreme value.')],
 [('What does exploratory analysis help you do?',['Prove a causal mechanism','Find patterns and possible data problems','Replace the experimental design'],1,'EDA informs later questions and model checks; it cannot establish causation by itself.'),('Should a correlation alone establish a treatment effect?',['Yes','No','Only when plotted in colour'],1,'Association can reflect confounding or other structures.')],
 [('For a logistic curve, biomass at its inflection is…',['Half the asymptote','The full asymptote','Always zero'],0,'The usual logistic curve has its inflection at A/2.'),('Repeated measurements on the same plant are…',['Automatically independent','Potentially correlated','Different independent plants'],1,'Within-plant dependence requires an appropriate design and model.')],
 [('For monthly data with annual seasonality, frequency is…',['7','12','365'],1,'There are 12 monthly observations in each annual cycle.'),('Which evaluation respects time order?',['Train on earlier observations and test on later ones','Randomly mix future values into training','Test only on fitted values'],0,'A time-ordered holdout avoids using future information to predict the past.')],
 [('A small p-value establishes…',['A large useful effect','Evidence against the null under the test assumptions','That the design was randomized'],1,'Effect size, uncertainty, and design still matter.'),('A paired t-test is appropriate for…',['Matched before-and-after observations','Any two unrelated samples','Three treatment groups automatically'],0,'The pairing must arise from the design and analysis concerns within-pair differences.')],
 [('Why include blocks in a randomized block ANOVA?',['To account for the blocking structure','To increase every p-value','To remove all residual variation'],0,'The model should reflect the allocation design and sources of variation.'),('What does an omnibus treatment F test address?',['Whether all treatment means are equal under the model','Which single pair differs without further analysis','Whether every observation is normal'],0,'An omnibus test does not identify every pairwise difference.')],
 [('A regression slope represents…',['Change in fitted mean response per predictor unit','A guaranteed causal effect','The residual standard deviation'],0,'The slope is conditional on the model and predictors.'),('Which interval is usually wider for the same new predictors?',['Prediction interval','Confidence interval for the mean','They must be identical'],0,'A prediction interval also includes variation in a new observation.')],
 [('Why render in a fresh R session?',['To reveal undocumented object dependencies','To make the p-value smaller','To remove the need for data'],0,'The document should recreate its objects from source.'),('What should you do with AI-generated R code?',['Submit without reading','Inspect, run, and verify the result','Assume all function names exist'],1,'You remain responsible for the code, assumptions, and interpretation.')]
]
exam = [
 ('You install a package. When should library(package) normally be used?', ['In each R session that needs it','Never again','Only before R is installed'],0),
 ('What is length(c(2, 4, 6, 8))?', ['2','4','8'],1),
 ('A CSV yield column imports as text. What should you do?', ['Inspect nonnumeric entries and units before conversion','Convert every failed entry to zero','Ignore the type'],0),
 ('A record appears twice. What determines whether it is a duplicate?', ['The observational unit and source identifiers','Equal yield alone','The row colour'],0),
 ('A group contains 3 records, including one NA yield. How many observed yields enter mean(x, na.rm=TRUE)?',['3','2','0'],1),
 ('In a box plot, a point beyond a whisker is…',['A value to investigate','Always a data-entry mistake','Proof that the treatment failed'],0),
 ('For c(2, 4, 6), what is the sample variance from var()?',['2','4','8'],1),
 ('Yield and rainfall both rise over time. A pooled correlation may reflect…',['A common trend','Randomization','A guaranteed rainfall intervention effect'],0),
 ('For Gompertz biomass A*exp(-exp(-k*(t-ti))), biomass at ti is…',['A/2','A/e','A'],1),
 ('Why is a centred moving average missing near series endpoints?',['It needs observations on both sides','Rainfall must be zero','The model necessarily failed'],0),
 ('A 95% confidence interval for a mean difference includes zero. Which statement is appropriate?',['The interval remains compatible with zero under its assumptions','The means are proven equal','The experiment has no value'],0),
 ('An interaction means that…',['One factor effect depends on the other factor level','Both factors have no effect','All observations are independent'],0),
 ('Predicting yield at a nitrogen dose far above the observed range is…',['Extrapolation','A residual check','Randomization'],0),
 ('A report describes a paired test but its code runs an unpaired test. The report is…',['Inconsistent despite successful execution','Correct because it renders','Automatically corrected by Quarto'],0)
]

base=Path(__file__).resolve().parents[1]
public={};private={}
for i, qs in enumerate(practice,1):
    cid=f'{i:02}'
    public[cid]=[dict(id=f'{cid}-{j}',prompt=q[0],options=q[1],answer=q[2],explanation=q[3]) for j,q in enumerate(qs)]
    private[cid]=public[cid]
(base/'public/practice.json').write_text(json.dumps(public),encoding='utf-8')
(base/'functions/content/questions.json').write_text(json.dumps({'chapters':private,'final':[dict(id=f'final-{i+1:02}',prompt=q[0],options=q[1],answer=q[2]) for i,q in enumerate(exam)]}),encoding='utf-8')
print('Created 28 practice questions and 14 private final-exam questions.')
