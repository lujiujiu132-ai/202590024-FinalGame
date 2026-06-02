import fs from 'fs';
import path from 'path';

const SPREADSHEET_ID = '15iGuHT7kncN3hHJIVb_EMDJk8AV7WS4oM4tRnJDG4rA';
const SHEETS = ['bg', 'player', 'Butler', 'Maid', 'Visitor', 'Niece', 'Doctor', 'Item', 'bgStart'];

// Minimal CSV parser that handles quotes and escape characters
function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(cell.trim());
        if (row.length > 1 || row[0] !== '') {
          result.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.length > 1 || row[0] !== '') {
      result.push(row);
    }
  }
  return result;
}

// Convert CSV rows to array of key-value objects
function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const list: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    list.push(obj);
  }
  return list;
}

async function run() {
  const outputDir = path.join(process.cwd(), 'src', 'data', 'fallback');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const sheetName of SHEETS) {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    console.log(`Fetching sheet: ${sheetName} from ${url}...`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      const text = await response.text();
      const rows = parseCSV(text);
      const objects = csvToObjects(rows);
      
      const filePath = path.join(outputDir, `${sheetName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(objects, null, 2));
      console.log(`Saved ${objects.length} records to ${filePath}`);
    } catch (err: any) {
      console.error(`Failed to fetch and process sheet ${sheetName}:`, err.message);
    }
  }
}

run();
