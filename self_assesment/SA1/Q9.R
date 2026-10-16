x<-c(1:30)
#filter for elements less than 8
y<-x[x < 8]
y
#filter for elements less than 8 or greater than 12
z<-x[(x < 8) | (x > 12)]
z
#filter for elements equal to 2, 6, or 12
q<-x[x %in% c(2, 6, 12)]
q

fruits <- c("banana", "apple", "orange")
sel_fruit<-fruits[fruits %in% c("banana","apple")]
sel_fruit



