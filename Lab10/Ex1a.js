month = "April"
day = 16
year = 2003

step1 = 03;
step2 = parseInt(step1/4);
step3 = step1 + step2;
step4 = 6;
step6 = step4 + step3;
step7 = step6 + day;
step8 = step7 - 1
step9 = step8 % 7;

console.log(step9);