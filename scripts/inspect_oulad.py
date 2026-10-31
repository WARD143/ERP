import os
import csv
import json

data_dir = r"C:\Users\hp\Downloads\ERP\data\oulad\raw"
files = [
    "courses.csv",
    "assessments.csv",
    "studentInfo.csv",
    "studentRegistration.csv",
    "studentAssessment.csv",
    "vle.csv",
    "studentVle.csv",
    "OULAD.names"
]

print("=== OULAD FILES INSPECTION ===")
report = {}

for f in files:
    fpath = os.path.join(data_dir, f)
    if not os.path.exists(fpath):
        print(f"MISSING: {f}")
        continue
    fsize = os.path.getsize(fpath)
    if f.endswith(".csv"):
        with open(fpath, "r", encoding="utf-8", errors="replace") as fh:
            reader = csv.reader(fh)
            header = next(reader)
            row_count = 0
            # Sample quick count without loading everything into memory
            for _ in reader:
                row_count += 1
        print(f"FILE: {f} | Size: {fsize:,} bytes | Rows: {row_count:,} | Headers: {header}")
        report[f] = {
            "size": fsize,
            "rows": row_count,
            "headers": header
        }
    else:
        print(f"FILE: {f} | Size: {fsize:,} bytes | (Metadata/Documentation)")

with open(r"C:\Users\hp\Downloads\ERP\data\oulad\inspection_summary.json", "w") as out:
    json.dump(report, out, indent=2)
print("Inspection written to data/oulad/inspection_summary.json")
