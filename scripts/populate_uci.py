import sqlite3
import os
import csv

# Raw math data snippet lines
math_raw = """school;sex;age;address;famsize;Pstatus;Medu;Fedu;Mjob;Fjob;reason;guardian;traveltime;studytime;failures;schoolsup;famsup;paid;activities;nursery;higher;internet;romantic;famrel;freetime;goout;Dalc;Walc;health;absences;G1;G2;G3
"GP";"F";18;"U";"GT3";"A";4;4;"at_home";"teacher";"course";"mother";2;2;0;"yes";"no";"no";"no";"yes";"yes";"no";"no";4;3;4;1;1;3;6;"5";"6";6
"GP";"F";17;"U";"GT3";"T";1;1;"at_home";"other";"course";"father";1;2;0;"no";"yes";"no";"no";"no";"yes";"yes";"no";5;3;3;1;1;3;4;"5";"5";6
"GP";"F";15;"U";"LE3";"T";1;1;"at_home";"other";"other";"mother";1;2;3;"yes";"no";"yes";"no";"yes";"yes";"yes";"no";4;3;2;2;3;3;10;"7";"8";10
"GP";"F";15;"U";"GT3";"T";4;2;"health";"services";"home";"mother";1;3;0;"no";"yes";"yes";"yes";"yes";"yes";"yes";"yes";3;2;2;1;1;5;2;"15";"14";15
"GP";"F";16;"U";"GT3";"T";3;3;"other";"other";"home";"father";1;2;0;"no";"yes";"yes";"no";"yes";"yes";"no";"no";4;3;2;1;2;5;4;"6";"10";10
"GP";"M";16;"U";"LE3";"T";4;3;"services";"other";"reputation";"mother";1;2;0;"no";"yes";"yes";"yes";"yes";"yes";"yes";"no";5;4;2;1;2;5;10;"15";"15";15
"GP";"M";16;"U";"LE3";"T";2;2;"other";"other";"home";"mother";1;2;0;"no";"no";"no";"no";"yes";"yes";"yes";"no";4;4;4;1;1;3;0;"12";"12";11
"GP";"F";17;"U";"GT3";"A";4;4;"other";"teacher";"home";"mother";2;2;0;"yes";"yes";"no";"no";"yes";"yes";"no";"no";4;1;4;1;1;1;6;"6";"5";6
"GP";"M";15;"U";"LE3";"A";3;2;"services";"other";"home";"mother";1;2;0;"no";"yes";"yes";"no";"yes";"yes";"yes";"no";4;2;2;1;1;1;0;"16";"18";19
"GP";"M";15;"U";"GT3";"T";3;4;"other";"other";"home";"mother";1;2;0;"no";"yes";"yes";"yes";"yes";"yes";"yes";"no";5;5;1;1;1;5;0;"14";"15";15
"GP";"F";15;"U";"GT3";"T";4;4;"teacher";"health";"reputation";"mother";1;2;0;"no";"yes";"yes";"no";"yes";"yes";"yes";"no";3;3;3;1;2;2;0;"10";"8";9
"GP";"F";15;"U";"GT3";"T";2;1;"services";"other";"reputation";"father";3;3;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";5;2;2;1;1;4;4;"10";"12";12
"GP";"M";15;"U";"LE3";"T";4;4;"health";"services";"course";"father";1;1;0;"no";"yes";"yes";"yes";"yes";"yes";"yes";"no";4;3;3;1;3;5;2;"14";"14";14
"GP";"M";15;"U";"GT3";"T";4;3;"teacher";"other";"course";"mother";2;2;0;"no";"yes";"yes";"no";"yes";"yes";"yes";"no";5;4;3;1;2;3;2;"10";"10";11
"GP";"M";15;"U";"GT3";"A";2;2;"other";"other";"home";"other";1;3;0;"no";"yes";"no";"no";"yes";"yes";"yes";"yes";4;5;2;1;1;3;0;"14";"16";16
"GP";"F";16;"U";"GT3";"T";4;4;"health";"other";"home";"mother";1;1;0;"no";"yes";"no";"no";"yes";"yes";"yes";"no";4;4;4;1;2;2;4;"14";"14";14
"GP";"F";16;"U";"GT3";"T";4;4;"services";"services";"reputation";"mother";1;3;0;"no";"yes";"yes";"yes";"yes";"yes";"yes";"no";3;2;3;1;2;2;6;"13";"14";14
"GP";"F";16;"U";"GT3";"T";3;3;"other";"other";"reputation";"mother";3;2;0;"yes";"yes";"no";"yes";"yes";"yes";"no";"no";5;3;2;1;1;4;4;"8";"10";10
"GP";"M";17;"U";"GT3";"T";3;2;"services";"services";"course";"mother";1;1;3;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";5;5;5;2;4;5;16;"6";"5";5
"GP";"M";16;"U";"LE3";"T";4;3;"health";"other";"home";"father";1;1;0;"no";"no";"yes";"yes";"yes";"yes";"yes";"no";3;1;3;1;3;5;4;"8";"10";10
"GP";"M";15;"U";"GT3";"T";4;3;"teacher";"other";"reputation";"mother";1;2;0;"no";"no";"no";"no";"yes";"yes";"yes";"no";4;4;1;1;1;1;0;"13";"14";15
"GP";"M";15;"U";"GT3";"T";4;4;"health";"health";"other";"father";1;1;0;"no";"yes";"yes";"no";"yes";"yes";"yes";"no";5;4;2;1;1;5;0;"12";"15";15
"GP";"M";16;"U";"LE3";"T";4;2;"teacher";"other";"course";"mother";1;2;0;"no";"no";"no";"yes";"yes";"yes";"yes";"no";4;5;1;1;3;5;2;"15";"15";16
"GP";"M";16;"U";"LE3";"T";2;2;"other";"other";"reputation";"mother";2;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";5;4;4;2;4;5;0;"13";"13";12
"GP";"F";15;"R";"GT3";"T";2;4;"services";"health";"course";"mother";1;3;0;"yes";"yes";"yes";"yes";"yes";"yes";"yes";"no";4;3;2;1;1;5;2;"10";"9";8
"GP";"F";16;"U";"GT3";"T";2;2;"services";"services";"home";"mother";1;1;2;"no";"yes";"yes";"no";"no";"yes";"yes";"no";1;2;2;1;3;5;14;"6";"9";8
"GP";"M";15;"U";"GT3";"T";2;2;"other";"other";"home";"mother";1;1;0;"no";"yes";"yes";"no";"yes";"yes";"yes";"no";4;2;2;1;2;5;2;"12";"12";11
"GP";"M";15;"U";"GT3";"T";4;2;"health";"services";"other";"mother";1;1;0;"no";"no";"yes";"no";"yes";"yes";"yes";"no";2;2;4;2;4;1;4;"15";"16";15
"GP";"M";16;"U";"LE3";"A";3;4;"services";"other";"home";"mother";1;2;0;"yes";"yes";"no";"yes";"yes";"yes";"yes";"no";5;3;3;1;1;5;4;"11";"11";11
"GP";"M";16;"U";"GT3";"T";4;4;"teacher";"teacher";"home";"mother";1;2;0;"no";"yes";"yes";"yes";"yes";"yes";"yes";"yes";4;4;5;5;5;5;16;"10";"12";11
"GP";"M";15;"U";"GT3";"T";4;4;"health";"services";"home";"mother";1;2;0;"no";"yes";"yes";"no";"no";"yes";"yes";"no";5;4;2;3;4;5;0;"9";"11";12
"GP";"M";15;"U";"GT3";"T";4;4;"services";"services";"reputation";"mother";2;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";4;3;1;1;1;5;0;"17";"16";17
"GP";"M";15;"R";"GT3";"T";4;3;"teacher";"at_home";"course";"mother";1;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"yes";4;5;2;1;1;5;0;"17";"16";16
"GP";"M";15;"U";"LE3";"T";3;3;"other";"other";"course";"mother";1;2;0;"no";"no";"no";"yes";"no";"yes";"yes";"no";5;3;2;1;1;2;0;"8";"10";12
"GP";"M";16;"U";"GT3";"T";3;2;"other";"other";"home";"mother";1;1;0;"no";"yes";"yes";"no";"no";"yes";"yes";"no";5;4;3;1;1;5;0;"12";"14";15
"GP";"F";15;"U";"GT3";"T";2;3;"other";"other";"other";"father";2;1;0;"no";"yes";"no";"yes";"yes";"yes";"no";"no";3;5;1;1;1;5;0;"8";"7";6
"GP";"M";15;"U";"LE3";"T";4;3;"teacher";"services";"home";"mother";1;3;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";5;4;3;1;1;4;2;"15";"16";18
"GP";"M";16;"R";"GT3";"A";4;4;"other";"teacher";"reputation";"mother";2;3;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"yes";2;4;3;1;1;5;7;"15";"16";15
"GP";"F";15;"R";"GT3";"T";3;4;"services";"health";"course";"mother";1;3;0;"yes";"yes";"yes";"yes";"yes";"yes";"yes";"no";4;3;2;1;1;5;2;"12";"12";11
"GP";"F";15;"R";"GT3";"T";2;2;"at_home";"other";"reputation";"mother";1;1;0;"yes";"yes";"yes";"yes";"yes";"yes";"no";"no";4;3;1;1;1;2;8;"14";"13";13
"GP";"F";16;"U";"LE3";"T";2;2;"other";"other";"home";"mother";2;2;1;"no";"yes";"no";"yes";"no";"yes";"yes";"yes";3;3;3;1;2;3;25;"7";"10";11
"GP";"M";15;"U";"LE3";"T";4;4;"teacher";"other";"home";"other";1;1;0;"no";"yes";"no";"no";"no";"yes";"yes";"yes";5;4;3;2;4;5;8;"12";"12";12
"GP";"M";15;"U";"GT3";"T";4;4;"services";"teacher";"course";"father";1;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";4;3;3;1;1;5;2;"19";"18";18
"GP";"M";15;"U";"GT3";"T";2;2;"services";"services";"course";"father";1;1;0;"yes";"yes";"no";"no";"yes";"yes";"yes";"no";5;4;1;1;1;1;0;"8";"8";11
"GP";"F";16;"U";"LE3";"T";2;2;"other";"at_home";"course";"father";2;2;1;"yes";"no";"no";"yes";"yes";"yes";"yes";"no";4;3;3;2;2;5;14;"10";"10";9
"GP";"F";15;"U";"LE3";"A";4;3;"other";"other";"course";"mother";1;2;0;"yes";"yes";"yes";"yes";"yes";"yes";"yes";"yes";5;2;2;1;1;5;8;"8";"8";6
"GP";"F";16;"U";"LE3";"A";3;3;"other";"services";"home";"mother";1;2;0;"no";"yes";"no";"no";"yes";"yes";"yes";"no";2;3;5;1;4;3;12;"11";"12";11
"GP";"M";16;"U";"GT3";"T";4;3;"health";"services";"reputation";"mother";1;4;0;"no";"no";"no";"yes";"yes";"yes";"yes";"no";4;2;2;1;1;2;4;"19";"19";20
"GP";"M";15;"U";"GT3";"T";4;2;"teacher";"other";"home";"mother";1;2;0;"no";"yes";"yes";"no";"yes";"yes";"no";"no";4;3;3;2;2;5;2;"15";"15";14
"GP";"F";15;"U";"GT3";"T";4;4;"services";"teacher";"other";"father";1;2;1;"yes";"yes";"no";"yes";"no";"yes";"yes";"no";4;4;4;1;1;3;2;"7";"7";7
"MS";"F";18;"R";"LE3";"T";4;4;"other";"other";"reputation";"mother";2;3;0;"no";"no";"no";"no";"yes";"yes";"yes";"no";5;4;4;1;1;1;0;"19";"18";19
"MS";"F";18;"R";"GT3";"T";1;1;"other";"other";"home";"mother";4;3;0;"no";"no";"no";"no";"yes";"yes";"yes";"no";4;3;2;1;2;4;2;"8";"8";10
"MS";"F";20;"U";"GT3";"T";4;2;"health";"other";"course";"other";2;3;2;"no";"yes";"yes";"no";"no";"yes";"yes";"yes";5;4;3;1;1;3;4;"15";"14";15
"MS";"F";18;"R";"LE3";"T";4;4;"teacher";"services";"course";"mother";1;2;0;"no";"no";"yes";"yes";"yes";"yes";"yes";"no";5;4;3;3;4;2;4;"8";"9";10
"MS";"F";18;"U";"GT3";"T";3;3;"other";"other";"home";"mother";1;2;0;"no";"no";"yes";"no";"yes";"yes";"yes";"yes";4;1;3;1;2;1;0;"15";"15";15
"MS";"F";17;"R";"GT3";"T";3;1;"at_home";"other";"reputation";"mother";1;2;0;"no";"yes";"yes";"yes";"no";"yes";"yes";"no";4;5;4;2;3;1;17;"10";"10";10
"MS";"M";18;"U";"GT3";"T";4;4;"teacher";"teacher";"home";"father";1;2;0;"no";"no";"yes";"yes";"no";"yes";"yes";"no";3;2;4;1;4;2;4;"15";"14";14
"MS";"M";18;"R";"GT3";"T";2;1;"other";"other";"other";"mother";2;1;0;"no";"no";"no";"yes";"no";"yes";"yes";"yes";4;4;3;1;3;5;5;"7";"6";7
"MS";"M";17;"U";"GT3";"T";2;3;"other";"services";"home";"father";2;2;0;"no";"no";"no";"yes";"yes";"yes";"yes";"no";4;4;3;1;1;3;2;"11";"11";10
"MS";"M";19;"R";"GT3";"T";1;1;"other";"services";"other";"mother";2;1;1;"no";"no";"no";"no";"yes";"yes";"no";"no";4;3;2;1;3;5;0;"6";"5";0
"MS";"M";18;"R";"GT3";"T";4;2;"other";"other";"home";"father";2;1;1;"no";"no";"yes";"no";"yes";"yes";"no";"no";5;4;3;4;3;3;14;"6";"5";5
"MS";"F";18;"R";"GT3";"T";2;2;"at_home";"other";"other";"mother";2;3;0;"no";"no";"yes";"no";"yes";"yes";"no";"no";5;3;3;1;3;4;2;"10";"9";10
"MS";"F";18;"R";"GT3";"T";4;4;"teacher";"at_home";"reputation";"mother";3;1;0;"no";"yes";"yes";"yes";"yes";"yes";"yes";"yes";4;4;3;2;2;5;7;"6";"5";6
"MS";"F";19;"R";"GT3";"T";2;3;"services";"other";"course";"mother";1;3;1;"no";"no";"no";"yes";"no";"yes";"yes";"no";5;4;2;1;2;5;0;"7";"5";0
"MS";"F";18;"U";"LE3";"T";3;1;"teacher";"services";"course";"mother";1;2;0;"no";"yes";"yes";"no";"yes";"yes";"yes";"no";4;3;4;1;1;1;0;"7";"9";8
"MS";"F";18;"U";"GT3";"T";1;1;"other";"other";"course";"mother";2;2;1;"no";"no";"no";"yes";"yes";"yes";"no";"no";1;1;1;1;1;5;0;"6";"5";0
"MS";"M";20;"U";"LE3";"A";2;2;"services";"services";"course";"other";1;2;2;"no";"yes";"yes";"no";"yes";"yes";"no";"no";5;5;4;4;5;4;11;"9";"9";9
"MS";"M";17;"U";"LE3";"T";3;1;"services";"services";"course";"mother";2;1;0;"no";"no";"no";"no";"no";"yes";"yes";"no";2;4;5;3;4;2;3;"14";"16";16
"MS";"M";21;"R";"GT3";"T";1;1;"other";"other";"course";"other";1;1;3;"no";"no";"no";"no";"no";"yes";"no";"no";5;5;3;3;3;3;3;"10";"8";7
"MS";"M";18;"R";"LE3";"T";3;2;"services";"other";"course";"mother";3;1;0;"no";"no";"no";"no";"no";"yes";"yes";"no";4;4;1;3;4;5;0;"11";"12";10
"MS";"M";19;"U";"LE3";"T";1;1;"other";"at_home";"course";"father";1;1;0;"no";"no";"no";"no";"yes";"yes";"yes";"no";3;2;3;3;3;5;5;"8";"9";9
"""

conn = sqlite3.connect('academic_analytics.sqlite')
cursor = conn.cursor()

def clean_val(v):
    return v.strip().strip('"')

def process_csv_content(content, course_name):
    lines = [l.strip() for l in content.strip().split('\n') if l.strip() and not l.startswith('d1=') and not l.startswith('d2=') and not l.startswith('d3=') and not l.startswith('print(')]
    if not lines:
        return []
    
    header = [clean_val(c) for c in lines[0].split(';')]
    records = []
    
    for row_line in lines[1:]:
        if ';' not in row_line:
            continue
        cols = [clean_val(c) for c in row_line.split(';')]
        if len(cols) != len(header):
            continue
            
        row_dict = dict(zip(header, cols))
        g1 = int(row_dict.get('G1', 0))
        g2 = int(row_dict.get('G2', 0))
        g3 = int(row_dict.get('G3', 0))
        
        # Risk assessment based on academic benchmarks:
        # G3 < 10 is failure (high risk)
        # G3 between 10 and 13 is moderate risk
        # G3 >= 14 is safe / low risk
        if g3 < 10:
            risk = 'HIGH'
        elif g3 <= 13:
            risk = 'MEDIUM'
        else:
            risk = 'LOW'
            
        score_pct = round((g3 / 20.0) * 100.0, 1)
        
        cursor.execute("""
            INSERT INTO uci_student_records (
                subject_course, school, sex, age, address, famsize, pstatus,
                medu, fedu, mjob, fjob, reason, guardian, traveltime, studytime,
                failures, schoolsup, famsup, paid, activities, nursery, higher,
                internet, romantic, famrel, freetime, goout, dalc, walc, health,
                absences, g1, g2, g3, risk_status, final_score_pct
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            course_name,
            row_dict['school'],
            row_dict['sex'],
            int(row_dict['age']),
            row_dict['address'],
            row_dict['famsize'],
            row_dict['Pstatus'],
            int(row_dict['Medu']),
            int(row_dict['Fedu']),
            row_dict['Mjob'],
            row_dict['Fjob'],
            row_dict['reason'],
            row_dict['guardian'],
            int(row_dict['traveltime']),
            int(row_dict['studytime']),
            int(row_dict['failures']),
            row_dict['schoolsup'],
            row_dict['famsup'],
            row_dict['paid'],
            row_dict['activities'],
            row_dict['nursery'],
            row_dict['higher'],
            row_dict['internet'],
            row_dict['romantic'],
            int(row_dict['famrel']),
            int(row_dict['freetime']),
            int(row_dict['goout']),
            int(row_dict['Dalc']),
            int(row_dict['Walc']),
            int(row_dict['health']),
            int(row_dict['absences']),
            g1,
            g2,
            g3,
            risk,
            score_pct
        ))
        records.append(row_dict)
        
    return records

cursor.execute("DELETE FROM uci_student_records")
conn.commit()

mat_records = process_csv_content(math_raw, "Mathematics")
conn.commit()

# Save raw CSV files into public/data for downloading and client consumption
os.makedirs('public/data', exist_ok=True)
with open('public/data/student-mat.csv', 'w') as f:
    f.write(math_raw.strip())

count = cursor.execute("SELECT COUNT(*) FROM uci_student_records").fetchone()[0]
print(f"Successfully populated {count} UCI Student Performance records into academic_analytics.sqlite!")
conn.close()
