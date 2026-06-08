import { readFileSync, writeFileSync } from 'fs';

function logKeys() {
  const data = JSON.parse(readFileSync('notion_content.json', 'utf-8'));
  const rm = data.fullData?.recordMap || {};
  console.log('RecordMap Keys:', Object.keys(rm));
  
  if (rm.collection) {
    console.log('Collection keys:', Object.keys(rm.collection));
    const firstColKey = Object.keys(rm.collection)[0];
    if (firstColKey) {
      console.log('First collection value:', JSON.stringify(rm.collection[firstColKey], null, 2));
    }
  }
  if (rm.collection_view) {
    console.log('Collection view keys:', Object.keys(rm.collection_view));
  }
}

logKeys();
