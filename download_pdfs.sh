#!/usr/bin/env bash

URL="https://ftn.uns.ac.rs/raspored-i-realizacija-2/"
HTML_FILE="realizacija.html"
TARGET="Raspored nastave za zimski semestar 2026/2027"

curl -sL "$URL" -o "$HTML_FILE"

mkdir -p pdfs/{oss,mas,mss}

awk -v target="$TARGET" '
    /<details/  { in_details=1; buf="" }
    in_details  { buf = buf $0 "\n" }
    /<\/details>/ {
        if (in_details && index(buf, target) > 0) {
            print buf
        }
        in_details=0
    }
' "$HTML_FILE" \
  | grep -oE 'https://[^"]+\.pdf' \
  | sort -u \
  | while read -r url; do
      file=$(basename "$url")

      case "$file" in
          OSS-*) dir="pdfs/oss" ;;
          MAS-*) dir="pdfs/mas" ;;
          MSS-*) dir="pdfs/mss" ;;
          *)     dir="pdfs" ;;
      esac

      echo "Downloading $file -> $dir/"
      curl -sL "$url" -o "$dir/$file"
  done

# mkdir -p pdfs
# mkdir -p pdfs/oss
# mkdir -p pdfs/mas
# mkdir -p pdfs/mss
# 
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Animacija-u-inzenjerstvu-7.pdf > pdfs/Animacija-u-inzenjerstvu-7.pdf 
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Arhitektura-8.pdf> pdfs/Arhitektura-8.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Biomedicinsko-inzenjerstvo-11.pdf> pdfs/Biomedicinsko-inzenjerstvo-11.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Ciste-energetske-tehnologije-4.pdf> pdfs/Ciste-energetske-tehnologije-4.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Energetika-elektronika-i-telekomunikacije-13.pdf> pdfs/Energetika-elektronika-i-telekomunikacije-13.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Geodezija-i-geoinformatika-6.pdf> pdfs/Geodezija-i-geoinformatika-6.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Graficko-inzenjerstvo-i-dizajn-7.pdf> pdfs/Graficko-inzenjerstvo-i-dizajn-7.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Gradevinarstvo-7.pdf> pdfs/Gradevinarstvo-7.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Industrijsko-inzenjerstvo-8.pdf> pdfs/Industrijsko-inzenjerstvo-8.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Inzenjerski-menadzment-15.pdf> pdfs/Inzenjerski-menadzment-15.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Inzenjerstvo-informacionih-sistema-11.pdf> pdfs/Inzenjerstvo-informacionih-sistema-11.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Informacioni-inzenjering-7.pdf> pdfs/Informacioni-inzenjering-7.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Inzenjerstvo-zastite-zivotne-sredine-i-zastite-na-radu-5.pdf> pdfs/Inzenjerstvo-zastite-zivotne-sredine-i-zastite-na-radu-5.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Masinstvo-Proizvodno-masinstvo-7.pdf> pdfs/Masinstvo-Proizvodno-masinstvo-7.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Masinstvo-Mehanizacija-i-konstrukciono-masinstvo-4.pdf> pdfs/Masinstvo-Mehanizacija-i-konstrukciono-masinstvo-4.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Masinstvo-Energetika-i-procesna-tehnika-4.pdf> pdfs/Masinstvo-Energetika-i-procesna-tehnika-4.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Masinstvo-Tehnicka-mehanika-i-dizajn-u-tehnici-3.pdf> pdfs/Masinstvo-Tehnicka-mehanika-i-dizajn-u-tehnici-3.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Mehatronika-5.pdf> pdfs/Mehatronika-5.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Merenje-i-regulacija-9.pdf> pdfs/Merenje-i-regulacija-9.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Primenjeno-softversko-inzenjerstvo-10.pdf> pdfs/Primenjeno-softversko-inzenjerstvo-10.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Racunarstvo-i-automatika-16.pdf> pdfs/Racunarstvo-i-automatika-16.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Saobracaj-i-transport-postanski-saobracaj-i-telekomunikacije-7.pdf > pdfs/Saobracaj-i-transport-postanski-saobracaj-i-telekomunikacije-7.pdf 
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Scenska-arhitektura-tehnika-i-dizajn-2.pdf> pdfs/Scenska-arhitektura-tehnika-i-dizajn-2.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Softversko-inzenjerstvo-i-informacione-tehnologije-10.pdf> pdfs/Softversko-inzenjerstvo-i-informacione-tehnologije-10.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/Upravljanje-rizikom-od-katastrofalnih-dogadaja-i-pozara-4.pdf> pdfs/Upravljanje-rizikom-od-katastrofalnih-dogadaja-i-pozara-4.pdf
# 
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/OSS-Elektrotehnika-4.pdf> pdfs/oss/OSS-Elektrotehnika-4.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/OSS-Softverske-informacione-tehnologije-4.pdf> pdfs/oss/OSS-Softverske-informacione-tehnologije-4.pdf
# 
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/MAS-Informaciona-bezbednost.pdf> pdfs/mas/MAS-Informaciona-bezbednost.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/MAS-Inzenjerstvo-tretmana-i-zastita-voda.pdf> pdfs/mas/MAS-Inzenjerstvo-tretmana-i-zastita-voda.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/MAS-Matematika-u-tehnici.pdf> pdfs/mas/MAS-Matematika-u-tehnici.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/MAS-Planiranje-i-upravljanje-regionalnim-razvojem.pdf> pdfs/mas/MAS-Planiranje-i-upravljanje-regionalnim-razvojem.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/MAS-Vestacka-inteligencija-i-masinsko-ucenje.pdf> pdfs/mas/MAS-Vestacka-inteligencija-i-masinsko-ucenje.pdf
# 
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/MSS-Elektrotehnika-2.pdf> pdfs/mss/MSS-Elektrotehnika-2.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/MSS-Inzenjerski-menadzment-MBA.pdf> pdfs/mss/MSS-Inzenjerski-menadzment-MBA.pdf
# curl https://ftn.uns.ac.rs/wp-content/uploads/2026/09/MSS-Proizvodno-masinstvo.pdf > pdfs/mss/MSS-Proizvodno-masinstvo.pdf 
