from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright
import pdfplumber
from pdfplumber.table import TableSettings
import json
import re

# ============================================================
# Configuration
# ============================================================

DAYS = [
    "ПОНЕДЕЉАК",
    "ПОНЕДЕЛЈАК",
    "УТОРАК",
    "СРЕДА",
    "ЧЕТВРТАК",
    "ПЕТАК",
]



data = {}

def find_header(page):
    found = False
    header = ""
    for line in page.extract_text().splitlines():
        if "РАСПОРЕД" in line:
            found = True
            header = line.split("-")[1].strip()
        elif "РАСПОРЕД" in line.replace(" ", ""):
            found = True
            header = line
        elif found:
            for day in DAYS:
                if day in line.replace(" ", ""):
                    return header
            header += " " + line
    return header

def find_day_headers(page):
    lines = page.extract_text_lines()
    headers = []

    for line in lines:
        text = line["text"].replace(" ", "").upper()

        if text in DAYS:
            headers.append((text, line["top"]))

    return headers

def extract_table_rows(PDF_FILE):
    with pdfplumber.open(PDF_FILE) as pdf:
        print(f"📄 Opening {PDF_FILE} ({len(pdf.pages)} pages)")
        for page in pdf.pages:

            headers = find_day_headers(page)
            page_header = find_header(page)

            print(f"  └─ Page {page.page_number}: '{page_header[:45]}...' -> Found {len(headers)} days")

            # print(headers)
            # print(page_header)

            for i, (header, top) in enumerate(headers):
                if i + 1 < len(headers):
                    bottom = headers[i + 1][1] - 5
                else:
                    bottom = page.height
                # print(top, bottom)

                cropped_page = page.crop(
                    (0, top, page.width, bottom)
                )

                table = cropped_page.extract_table()
                # generate an image

                filename_without_ext = Path(PDF_FILE).stem

                #cropped_page.to_image(resolution=150).save(f"img/{filename_without_ext}_page_{page.page_number}_{header}.png")

                if page_header not in data:
                    data[page_header] = []
                if table is not None:
                    data[page_header].append(table)

    return data

def split_into_days():
    return
    for key, table in data.items():
        day_tables = {day: [] for day in DAYS}
        current_day = None
        for row in table:
            print(row)
            if any(day in row[0] for day in DAYS):
                current_day = next(day for day in DAYS if day in row[0])
            elif current_day:
                day_tables[current_day].append(row)
        data[key] = day_tables

def convert_v(v):
    # v is a list of tables, each table is a list of rows, each row is a list of cells
    # for each element, get the first cell of first row, convert it into a key, all other rows are value
    result = {}
    for table in v:
        if len(table) == 0:
            continue
        key = table[0][0]
        value = table[1:]
        result[key] = value
    return result

def format_name(name):
    if name.startswith("Основне академске студије"):
        prefix = "ОАС"
        name = name.replace("Основне академске студије ", "", 1)
    elif name.startswith("Мастер академске студије"):
        prefix = "МАС"
        name = name.replace("Мастер академске студије ", "", 1)
    elif name.startswith("Р А С П О Р Е Д П Р Е Д А В А Н Ј А "):
        prefix = "ОАС"
        name = name.replace("Р А С П О Р Е Д П Р Е Д А В А Н Ј А ", "", 1)
    else:
        return name

    parts = name.split(" ", 2)
    semester = parts[0]
    subject = parts[2]

    subject = re.sub(r"\s+(?:Модул|Стручна област):\s*", " | ", subject)

    return f"{prefix} | {semester}. Семестар | {subject}"

if __name__ == "__main__":

    data_file = Path("raw-data.json")
    data = {}
    if data_file.exists():
        with open(data_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        # for each pdf file in folder pdfs/
        for pdf_file in Path("pdfs").glob("*.pdf"):
            filename = "pdfs/" + pdf_file.name
            # print("Processing PDF file: " + filename)
            extract_table_rows(filename)
        #print(data)

        split_into_days()

        data_file = Path("raw-data.json")
        with open(data_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    

    for k, days in data.items():
        data[k] = [
            day for day in days
            if not any(
                predavanje[0] and ("Стари" in predavanje[0] or "2026" in predavanje[0])
                for predavanje in day
            )
        ]

        if len(data[k]) != 5 and len(data[k]) != 0:
            print(f"⚠️  Skipping '{k}': expected 5 days, found {len(data[k])}")
            print(f"  Days: {data[k]}")


    data = {k: convert_v(v) for k, v in data.items() if len(v) == 5}

    # for key, value in data.items():
        # print(f"Page header: {key}")
        # print(f"Days: {len(value)}")
        # for day, table in value.items():
            # print(f"  {day}: {len(table)} rows")

    data = {format_name(k): v for k, v in data.items()}

    data = dict(sorted(
        data.items(),
        key=lambda item: (0 if item[0].startswith("ОАС") else 1, item[0])
    ))

    for key in data:
        data[key] = {
            k.replace(" ", "") 
                .replace("ПОНЕДЕЛЈАК", "ПОНЕДЕЉАК")
            : v
            for k, v in data[key].items()
        } 

    for smer in data:
        for day in data[smer]:
            for predavanje in data[smer][day]:
                for i in range(len(predavanje) - 1):
                    if predavanje[i] and not predavanje[i + 1]:
                        parts = predavanje[i].split(" ", 1)
                        if len(parts) == 2:
                            predavanje[i] = parts[0]
                            predavanje[i + 1] = parts[1]
                    
                    if not predavanje[i] and not predavanje[i + 1]:
                        data[smer][day].remove(predavanje)
                        break


    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)