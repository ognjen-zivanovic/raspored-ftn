import { data } from './data.js';
import { days, COLORS } from './constants.js';

const targetGroups = [];
let targetStudyProgram = "ОАС | 3. Семестар | Софтверско инжењерство и информационе технологије";

document.getElementById("brojgrupe").innerHTML = "О. Ж."

const SUBJECT_NAMES = localStorage.getItem("subjectNames") ? JSON.parse(localStorage.getItem("subjectNames")) : {};
export function handleChange(element) {
    SUBJECT_NAMES[element.dataset.subject] = element.textContent.trim();
    localStorage.setItem("subjectNames", JSON.stringify(SUBJECT_NAMES));
}
window.handleChange = handleChange;

export function refreshSchedule() {
    generateSchedule(data[targetStudyProgram], targetGroups);
    generateGroupCheckboxes(data[targetStudyProgram]);
    generateColorPickers();
}
window.refreshSchedule = refreshSchedule;

const EVENT_TEMPLATE = (subject, startCss, durationCss, bgColor, borderStyle, borderColor, title, footer) => `
<div data-v-3c342954="" data-v-31b54b0a="" class="event" style="top: calc(${startCss}); height: ${durationCss}; color: rgb(249, 249, 249); background-color: ${bgColor}; border-style: ${borderStyle}; border-color: ${borderColor};">
  <div data-v-3c342954="" style="max-height: calc(100% - 20px); overflow: hidden">
    <div data-v-3c342954="" class="event__title" style="justify-content: center" contenteditable="true" data-subject="${subject}" oninput="handleChange(this)" onblur="refreshSchedule()">
      <span data-v-3c342954="">${title}</span>
    </div>
    <div data-v-3c342954="" class="event__description"></div>
  </div>
  <div data-v-3c342954="" class="event__duration">${footer}</div>
</div>`;

let colorMap = localStorage.getItem("colorMap") ? JSON.parse(localStorage.getItem("colorMap")) : {};
let colorIndex = localStorage.getItem("colorIndex") ? JSON.parse(localStorage.getItem("colorIndex")) : {};

function getColor(subject) {
    if (!colorMap[subject]) {
        if (!colorIndex[targetStudyProgram]) {
            colorIndex[targetStudyProgram] = 0;
        }
        colorMap[subject] = COLORS[colorIndex[targetStudyProgram]];
        localStorage.setItem("colorMap", JSON.stringify(colorMap));
        colorIndex[targetStudyProgram] = (colorIndex[targetStudyProgram] + 1) % COLORS.length;
        localStorage.setItem("colorIndex", JSON.stringify(colorIndex));
    }
    return colorMap[subject];
}

function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
}



function generateEventHtml(entry, isAlternatingWeek = false) {
    const HOURS_PER_DAY = 15;
    const DAY_START_HOUR = 7;
    const [groupStr, startStr, endStr, classroom, classType, subject] = entry;
    const subjectName = SUBJECT_NAMES[subject] || subject;

    const startMinutes = parseTimeToMinutes(startStr);
    const endMinutes = parseTimeToMinutes(endStr);

    const durationMinutes = endMinutes - startMinutes;
    const durationCss = `${(durationMinutes / (HOURS_PER_DAY * 60)) * 100}%`;

    const startSecondsFromDayStart = (startMinutes - DAY_START_HOUR * 60) * 60;
    const startValue = startSecondsFromDayStart / (HOURS_PER_DAY * 60 * 60);
    const startCss = `${startValue * 100}% + ${startValue * 1.5}px`;

    const color = getColor(subject);
    const bgColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

    const isLecture = classType.includes("Пред");
    const borderColor = isLecture ? "rgb(0, 0, 0)" : "rgb(192, 192, 192)";

    const borderStyle = isAlternatingWeek ? "dashed" : "solid";

    const title = `${subjectName}`;
    //${classroom.trim()}
    const footer = `${classroom.trim()} | ${startStr.trim()} - ${endStr.trim()}`;
    return EVENT_TEMPLATE(subject, startCss, durationCss, bgColor, borderStyle, borderColor, title, footer);
}

function preprocessGroupString(input) {
    return input.replaceAll("\n", "").replaceAll(" ", "").replaceAll(".", "")
}
function parseGroup(input) {
    input = preprocessGroupString(input)
    let svakeDruge = false
    const svakeDrugeStrings = ["свдрнед", "свнепарненедеље", "свпарненедеље"]
    for (const svakeDrugeString of svakeDrugeStrings) {
        if (input.includes(svakeDrugeString)) {
            svakeDruge = true
            input = input.replace(svakeDrugeString, "").trim()
        }
    }
    const result = input.match(/[\dЉЊЕРТЗУИОПШЂЖАСДФГХЈКЛЧЋЅЏЦВБНМљњертзуиопшђасдфгхјклчћѕџцвбнм \-\.]+(?:\([^)]*-[^)]*\))?/g);
    if (!result) {
        return [[], svakeDruge]
    }
    const resultLen = result.reduce((acc, curr) => acc + curr.length, 0);
    if (resultLen + result.length - 1 !== input.length) {
        svakeDruge = true
    }
    return [result, svakeDruge]
}
function matchesGroup(groupStr, subjectName, targetGroups) {
    return groupStr.includes("СВИ") ||
        targetGroups.some(e => parseGroup(groupStr)[0].includes(e))
        || (targetGroups.some(e => e.includes("|")) &&
            targetGroups.some(e =>
                preprocessGroupString(groupStr).includes(e.split("|")[0].trim()) &&
                subjectName.includes(e.split("|")[1].trim())
            ));
}

// Generate schedule HTML and insert into DOM
const eventContainer = document.getElementById("event-container");
let startingHtml = eventContainer.innerHTML;

let subjectNames = [];

function generateSchedule(scheduleData, targetGroups) {
    // colorMap = {};
    subjectNames = [];
    let finalHtml = "";
    days.forEach(day => {
        finalHtml += `<div data-v-31b54b0a="" class="cell" style="flex: 1 0 0px">`;

        const dayEntries = scheduleData[day] || [];

        // Skip row 0 (headers)
        for (let i = 1; i < dayEntries.length; i++) {
            const entry = dayEntries[i];
            const groupStr = entry[0];
            const subjectName = entry[5];

            const isAlternatingWeek = parseGroup(groupStr)[1];

            if (matchesGroup(groupStr, subjectName, targetGroups)) {
                if (!subjectNames.includes(subjectName)) {
                    subjectNames.push(subjectName);
                }
                finalHtml += generateEventHtml(entry, isAlternatingWeek);
            }
        }

        finalHtml += `</div>`;
    });

    eventContainer.innerHTML = startingHtml + finalHtml;
}

function generateGroupCheckboxes(scheduleData) {
    groupContainer.innerHTML = "";
    const groupSet = new Set();

    Object.values(scheduleData).forEach(dayEntries => {
        for (let i = 1; i < dayEntries.length; i++) {
            const entry = dayEntries[i];
            const groupStr = entry[0];
            const subjectName = entry[5];
            const [groups, svakeDruge] = parseGroup(groupStr);
            groups.forEach(group => {
                if (group == "СВИ") {
                    return;
                }
                if (group.toLowerCase().includes("опред")) {
                    group += " | " + subjectName;
                }
                groupSet.add(group)
            });
        }
    });

    // Sort groups alphanumerically so they aren't a jumbled mess
    const sortedGroups = Array.from(groupSet).sort(new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare);

    sortedGroups.forEach(group => {
        // 1. Create a wrapper for flexbox alignment
        const wrapper = document.createElement("div");
        wrapper.className = "checkbox-wrapper";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = group;
        checkbox.id = `group-${group}`;

        const label = document.createElement("label");
        label.setAttribute("for", `group-${group}`);
        label.textContent = group;

        checkbox.addEventListener("change", () => {
            const checkedGroups = Array.from(groupContainer.querySelectorAll("input[type=checkbox]:checked")).map(cb => cb.value);
            targetGroups.length = 0;
            targetGroups.push(...checkedGroups);
            generateSchedule(scheduleData, targetGroups);
            generateColorPickers();
        });

        // 2. Append to wrapper, then append wrapper to container
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        groupContainer.appendChild(wrapper);
    });
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return [r, g, b];
}

function generateColorPickers() {
    const colorPickersContainer = document.getElementById("color-pickers");
    colorPickersContainer.innerHTML = ""; // Clear existing pickers

    subjectNames.forEach(subject => {
        const colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.value = `#${colorMap[subject].map(c => c.toString(16).padStart(2, '0')).join('')}`;
        colorPicker.title = subject;

        colorPicker.addEventListener("change", () => {
            const hexColor = colorPicker.value;
            const rgbColor = hexToRgb(hexColor);
            colorMap[subject] = rgbColor;
            localStorage.setItem("colorMap", JSON.stringify(colorMap));
            refreshSchedule();
        });

        colorPickersContainer.appendChild(colorPicker);
    });
}

const cyrToLatMap = {
    // Uppercase Digraphs
    'Љ': 'Lj', 'Њ': 'Nj', 'Џ': 'Dz',
    // Lowercase Digraphs
    'љ': 'lj', 'њ': 'nj', 'џ': 'dz',
    // Standard Uppercase
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Dj', 'Е': 'E',
    'Ж': 'Z', 'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'Ћ': 'C',
    'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'C', 'Ш': 'S',
    // Standard Lowercase
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'dj', 'е': 'e',
    'ж': 'z', 'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'c',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'c', 'ш': 's'
};

// Compile multi-char and single-char patterns in one Regex
const cyrRegex = new RegExp(Object.keys(cyrToLatMap).join('|'), 'g');

function toLatin(str) {
    return str.replace(cyrRegex, match => cyrToLatMap[match]);
}
// Sidebar Setup
const sidebar = document.getElementById("sidebar");
sidebar.className = "modern-sidebar"; // Add class for styling

const dropdown = document.createElement("input");
dropdown.id = "study-program-dropdown";
dropdown.className = "modern-dropdown"; // Add class for styling
dropdown.placeholder = targetStudyProgram;
dropdown.setAttribute("list", "study-program-options");

const datalist = document.createElement("datalist");
datalist.id = "study-program-options";

Object.keys(data).forEach(program => {
    const option = document.createElement("option");
    option.text = toLatin(program);
    option.value = program;
    datalist.appendChild(option);
});
dropdown.appendChild(datalist);


dropdown.addEventListener("change", (event) => {
    targetStudyProgram = event.target.value;
    generateSchedule(data[targetStudyProgram], targetGroups);
    generateGroupCheckboxes(data[targetStudyProgram]);
    generateColorPickers();
});

sidebar.appendChild(dropdown);

// Group Container Setup
const groupContainer = document.createElement("div");
groupContainer.id = "group-container";
groupContainer.className = "group-list"; // Add class for styling
sidebar.appendChild(groupContainer);

const colorPickers = document.createElement("div");
colorPickers.id = "color-pickers";
colorPickers.className = "color-pickers"; // Add class for styling
sidebar.appendChild(colorPickers);

refreshSchedule();

console.log(
    Object.fromEntries(
        Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
    )
);