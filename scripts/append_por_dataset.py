import sqlite3
import os

por_raw = """school;sex;age;address;famsize;Pstatus;Medu;Fedu;Mjob;Fjob;reason;guardian;traveltime;studytime;failures;schoolsup;famsup;paid;activities;nursery;higher;internet;romantic;famrel;freetime;goout;Dalc;Walc;health;absences;G1;G2;G3
"GP";"F";18;"U";"GT3";"A";4;4;"at_home";"teacher";"course";"mother";2;2;0;"yes";"no";"no";"no";"yes";"yes";"no";"no";4;3;4;1;1;3;4;"0";"11";11
"GP";"F";17;"U";"GT3";"T";1;1;"at_home";"other";"course";"father";1;2;0;"no";"yes";"no";"no";"no";"yes";"yes";"no";5;3;3;1;1;3;2;"9";"11";11
"GP";"F";15;"U";"LE3";"T";1;1;"at_home";"other";"other";"mother";1;2;0;"yes";"no";"no";"no";"yes";"yes";"yes";"no";4;3;2;2;3;3;6;"12";"13";12
"GP";"F";15;"U";"GT3";"T";4;2;"health";"services";"home";"mother";1;3;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"yes";3;2;2;1;1;5;0;"14";"14";14
"GP";"F";16;"U";"GT3";"T";3;3;"other";"other";"home";"father";1;2;0;"no";"yes";"no";"no";"yes";"yes";"no";"no";4;3;2;1;2;5;0;"11";"13";13
"GP";"M";16;"U";"LE3";"T";4;3;"services";"other";"reputation";"mother";1;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";5;4;2;1;2;5;6;"12";"12";13
"GP";"M";16;"U";"LE3";"T";2;2;"other";"other";"home";"mother";1;2;0;"no";"no";"no";"no";"yes";"yes";"yes";"no";4;4;4;1;1;3;0;"13";"12";13
"GP";"F";17;"U";"GT3";"A";4;4;"other";"teacher";"home";"mother";2;2;0;"yes";"yes";"no";"no";"yes";"yes";"no";"no";4;1;4;1;1;1;2;"10";"13";13
"GP";"M";15;"U";"LE3";"A";3;2;"services";"other";"home";"mother";1;2;0;"no";"yes";"no";"no";"yes";"yes";"yes";"no";4;2;2;1;1;1;0;"15";"16";17
"GP";"M";15;"U";"GT3";"T";3;4;"other";"other";"home";"mother";1;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";5;5;1;1;1;5;0;"12";"12";13
"GP";"F";15;"U";"GT3";"T";4;4;"teacher";"health";"reputation";"mother";1;2;0;"no";"yes";"no";"no";"yes";"yes";"yes";"no";3;3;3;1;2;2;2;"14";"14";14
"GP";"F";15;"U";"GT3";"T";2;1;"services";"other";"reputation";"father";3;3;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";5;2;2;1;1;4;0;"10";"12";13
"GP";"M";15;"U";"LE3";"T";4;4;"health";"services";"course";"father";1;1;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";4;3;3;1;3;5;0;"12";"13";12
"GP";"M";15;"U";"GT3";"T";4;3;"teacher";"other";"course";"mother";2;2;0;"no";"yes";"no";"no";"yes";"yes";"yes";"no";5;4;3;1;2;3;0;"12";"12";13
"GP";"M";15;"U";"GT3";"A";2;2;"other";"other";"home";"other";1;3;0;"no";"yes";"no";"no";"yes";"yes";"yes";"yes";4;5;2;1;1;3;0;"14";"14";15
"GP";"F";16;"U";"GT3";"T";4;4;"health";"other";"home";"mother";1;1;0;"no";"yes";"no";"no";"yes";"yes";"yes";"no";4;4;4;1;2;2;6;"17";"17";17
"GP";"F";16;"U";"GT3";"T";4;4;"services";"services";"reputation";"mother";1;3;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";3;2;3;1;2;2;10;"13";"13";14
"GP";"F";16;"U";"GT3";"T";3;3;"other";"other";"reputation";"mother";3;2;0;"yes";"yes";"no";"yes";"yes";"yes";"no";"no";5;3;2;1;1;4;2;"13";"14";14
"GP";"M";17;"U";"GT3";"T";3;2;"services";"services";"course";"mother";1;1;3;"no";"yes";"yes";"yes";"yes";"yes";"yes";"no";5;5;5;2;4;5;2;"8";"8";7
"GP";"M";16;"U";"LE3";"T";4;3;"health";"other";"home";"father";1;1;0;"no";"no";"no";"yes";"yes";"yes";"yes";"no";3;1;3;1;3;5;6;"12";"12";12
"GP";"M";15;"U";"GT3";"T";4;3;"teacher";"other";"reputation";"mother";1;2;0;"no";"no";"no";"no";"yes";"yes";"yes";"no";4;4;1;1;1;1;0;"12";"13";14
"GP";"M";15;"U";"GT3";"T";4;4;"health";"health";"other";"father";1;1;0;"no";"yes";"yes";"no";"yes";"yes";"yes";"no";5;4;2;1;1;5;0;"11";"12";12
"GP";"M";16;"U";"LE3";"T";4;2;"teacher";"other";"course";"mother";1;2;0;"no";"no";"no";"yes";"yes";"yes";"yes";"no";4;5;1;1;3;5;0;"12";"13";14
"GP";"M";16;"U";"LE3";"T";2;2;"other";"other";"reputation";"mother";2;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";5;4;4;2;4;5;2;"10";"10";10
"GP";"F";15;"R";"GT3";"T";2;4;"services";"health";"course";"mother";1;3;0;"yes";"yes";"no";"yes";"yes";"yes";"yes";"no";4;3;2;1;1;5;2;"10";"11";10
"GP";"F";16;"U";"GT3";"T";2;2;"services";"services";"home";"mother";1;1;0;"no";"yes";"no";"no";"no";"yes";"yes";"no";1;2;2;1;3;5;6;"10";"11";12
"GP";"M";15;"U";"GT3";"T";2;2;"other";"other";"home";"mother";1;1;0;"no";"yes";"no";"no";"yes";"yes";"yes";"no";4;2;2;1;2;5;8;"11";"12";12
"GP";"M";15;"U";"GT3";"T";4;2;"health";"services";"other";"mother";1;1;0;"no";"no";"no";"no";"yes";"yes";"yes";"no";2;2;4;2;4;1;0;"11";"11";11
"GP";"M";16;"U";"LE3";"A";3;4;"services";"other";"home";"mother";1;2;0;"yes";"yes";"yes";"yes";"yes";"yes";"yes";"no";5;3;3;1;1;5;2;"12";"12";13
"GP";"M";16;"U";"GT3";"T";4;4;"teacher";"teacher";"home";"mother";1;2;0;"no";"yes";"yes";"yes";"yes";"yes";"yes";"yes";4;4;5;5;5;5;4;"12";"11";12
"GP";"M";15;"U";"GT3";"T";4;4;"health";"services";"home";"mother";1;2;0;"no";"yes";"yes";"no";"no";"yes";"yes";"no";5;4;2;3;4;5;0;"10";"11";11
"GP";"M";15;"U";"GT3";"T";4;4;"services";"services";"reputation";"mother";2;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";4;3;1;1;1;5;2;"15";"15";15
"GP";"M";15;"R";"GT3";"T";4;3;"teacher";"at_home";"course";"mother";1;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"yes";4;5;2;1;1;5;0;"13";"14";15
"GP";"M";15;"U";"LE3";"T";3;3;"other";"other";"course";"mother";1;2;0;"no";"no";"no";"yes";"no";"yes";"yes";"no";5;3;2;1;1;2;0;"13";"12";12
"GP";"M";16;"U";"GT3";"T";3;2;"other";"other";"home";"mother";1;1;0;"no";"yes";"no";"no";"no";"yes";"yes";"no";5;4;3;1;1;5;4;"12";"12";12
"GP";"F";15;"U";"GT3";"T";2;3;"other";"other";"other";"father";2;1;0;"no";"yes";"no";"yes";"yes";"yes";"no";"no";3;5;1;1;1;5;4;"11";"11";11
"GP";"M";15;"U";"LE3";"T";4;3;"teacher";"services";"home";"mother";1;3;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";5;4;3;1;1;4;0;"14";"14";14
"GP";"M";16;"R";"GT3";"A";4;4;"other";"teacher";"reputation";"mother";2;3;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"yes";2;4;3;1;1;5;4;"13";"13";13
"GP";"F";15;"R";"GT3";"T";3;4;"services";"health";"course";"mother";1;3;0;"yes";"yes";"no";"yes";"yes";"yes";"yes";"no";4;3;2;1;1;5;2;"11";"12";12
"GP";"F";15;"R";"GT3";"T";2;2;"at_home";"other";"reputation";"mother";1;1;0;"yes";"yes";"no";"yes";"yes";"yes";"no";"no";4;3;1;1;1;2;8;"14";"13";12
"GP";"F";16;"U";"LE3";"T";2;2;"other";"other";"home";"mother";2;2;0;"no";"yes";"no";"yes";"no";"yes";"yes";"yes";3;3;3;1;2;3;16;"11";"11";10
"GP";"M";15;"U";"LE3";"T";4;4;"teacher";"other";"home";"other";1;1;0;"no";"yes";"no";"no";"no";"yes";"yes";"yes";5;4;3;2;4;5;8;"10";"11";11
"GP";"M";15;"U";"GT3";"T";4;4;"services";"teacher";"course";"father";1;2;0;"no";"yes";"no";"yes";"yes";"yes";"yes";"no";4;3;3;1;1;5;0;"14";"15";15
"GP";"M";15;"U";"GT3";"T";2;2;"services";"services";"course";"father";1;1;0;"yes";"yes";"no";"no";"yes";"yes";"yes";"no";5;4;1;1;1;1;0;"9";"10";10
"GP";"F";16;"U";"LE3";"T";2;2;"other";"at_home";"course";"father";2;2;1;"yes";"no";"no";"yes";"yes";"yes";"yes";"no";4;3;3;2;2;5;14;"10";"11";11
"GP";"F";15;"U";"LE3";"A";4;3;"other";"other";"course";"mother";1;2;0;"yes";"yes";"yes";"yes";"yes";"yes";"yes";"yes";5;2;2;1;1;5;4;"10";"11";11
"GP";"F";16;"U";"LE3";"A";3;3;"other";"services";"home";"mother";1;2;0;"no";"yes";"no";"no";"yes";"yes";"yes";"no";2;3;5;1;4;3;6;"13";"12";13
"GP";"M";16;"U";"GT3";"T";4;3;"health";"services";"reputation";"mother";1;4;0;"no";"no";"no";"yes";"yes";"yes";"yes";"no";4;2;2;1;1;2;2;"17";"17";17
"GP";"M";15;"U";"GT3";"T";4;2;"teacher";"other";"home";"mother";1;2;0;"no";"yes";"no";"no";"yes";"yes";"no";"no";4;3;3;2;2;5;4;"11";"12";13
"GP";"F";15;"U";"GT3";"T";4;4;"services";"teacher";"other";"father";1;2;0;"yes";"yes";"no";"yes";"no";"yes";"yes";"no";4;4;4;1;1;3;2;"13";"12";12
"MS";"M";17;"U";"LE3";"T";3;1;"services";"services";"course";"mother";2;1;0;"no";"no";"no";"no";"no";"yes";"yes";"no";2;4;5;3;4;2;6;"10";"10";10
"MS";"M";18;"R";"LE3";"T";3;2;"services";"other";"course";"mother";3;1;0;"no";"no";"no";"no";"no";"yes";"yes";"no";4;4;1;3;4;5;4;"10";"11";11
"""

conn = sqlite3.connect('academic_analytics.sqlite')
cursor = conn.cursor()

def clean_val(v):
    return v.strip().strip('"')

lines = [l.strip() for l in por_raw.strip().split('\n') if l.strip()]
header = [clean_val(c) for c in lines[0].split(';')]

for row_line in lines[1:]:
    cols = [clean_val(c) for c in row_line.split(';')]
    if len(cols) != len(header):
        continue
    row_dict = dict(zip(header, cols))
    g1 = int(row_dict.get('G1', 0))
    g2 = int(row_dict.get('G2', 0))
    g3 = int(row_dict.get('G3', 0))
    
    risk = 'HIGH' if g3 < 10 else 'MEDIUM' if g3 <= 13 else 'LOW'
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
        "Portuguese",
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

conn.commit()

# Also write student-por.csv
with open('public/data/student-por.csv', 'w') as f:
    f.write(por_raw.strip())

total = cursor.execute("SELECT COUNT(*) FROM uci_student_records").fetchone()[0]
print(f"Total UCI records in database now: {total}")
conn.close()
