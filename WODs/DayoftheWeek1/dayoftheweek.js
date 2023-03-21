var day = 16;
var month = "April";
var year = 2003;

if(month == 'January'||month == 'February'){
    step1 = year - 1;
} else {step1 = year};

step2 = parseInt(step1/4) + step1;
step3 = step2-(parseInt(step1/100));
step4 = parseInt(step1/400) + step3;
step5 = step4 + day;
 
monthKey = {
January: 0,
February: 3,
March: 2,
April: 5,
May: 0,
June: 3,
July: 5,
August: 1,
September: 4,
October: 6,
November: 2,
December: 4
};

step6 = monthKey[month] + step5;
step7 = step6%7


dayNumber = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
]


dayoftheweek = dayNumber[step7]

console.log(month,day,year,dayoftheweek)