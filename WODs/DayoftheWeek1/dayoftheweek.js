var day = 21;
var month = "March";
var year = 2023;

if(month == 'January'||month == 'February'){
    x = year - 1;
} else {x = year}

x_div4 = parseInt(x/4) + x;
x_div100 = x_div4 - parseInt(x/100);
x_div400 = parseInt(x/400) + x_div100;
add_day = x_div400 + day;

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
}

add_monthKey = monthKey[month] + add_day;
x_div7 = add_monthKey%7;

dayNumber = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

dayoftheweek = dayNumber[x_div7]

console.log(month,day,year,dayoftheweek)