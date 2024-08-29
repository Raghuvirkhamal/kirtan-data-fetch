const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const xlsx = require('xlsx');

async function scrapeKirtanData(kid) {
  let browser;
  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.swaminarayankirtan.org/Kirtan_Display.aspx?Kid=${kid}`, { waitUntil: 'networkidle2' });

    // Extract the data you need
    const data = await page.evaluate(() => {
      // Check for the specific text indicating no audio/video available
      const noAudioVideoText = "કોઈ ઑડિયો / વીડિયો ઉપલબ્ધ નથી";
      const audioVideoElement = document.querySelector('#ctl00_ContentPlaceHolder1_td1');

      // If the text is found, return an empty JSON for audio_and_video
      if (audioVideoElement && audioVideoElement.innerText.includes(noAudioVideoText)) {
        return {
          kirtanName: document.querySelector('#ctl00_ContentPlaceHolder1_tdKirtanName')?.innerText || null,
          full_kirtan: document.querySelector('#pagecontent > table:nth-child(7) > tbody > tr:nth-child(3) > td')?.innerText || null,
          mul_pad: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanPadBody')?.innerText || null,
          malta_rag: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanMaltaRagBody')?.innerText || null,
          creator: document.querySelector('#ctl00_ContentPlaceHolder1_tdKirtanGayakBody')?.innerText || null,
          non_stop_kirtan: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanPrakashakHeader')?.innerText || null,
          utpati: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanBhashantarHeader')?.innerText || null,
          vivechan: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanVivechakHeader')?.innerText || null,
          photo: document.querySelector('#ctl00_ContentPlaceHolder1_DataList1 > tbody > tr > td:nth-child(1) > table > tbody > tr > td img')?.src || null,
          audio_and_video: "[]" // Empty JSON string
        };
      }

      // Extract the audio and video information if available
      const audioVideoData = [];
      document.querySelectorAll('#ctl00_ContentPlaceHolder1_grdkirtan tbody tr').forEach(row => {
        const audioLink = row.querySelector('#ctl00_ContentPlaceHolder1_grdkirtan > tbody > tr:nth-child(2) > td:nth-child(1) > a:nth-child(3)')?.href || null;
        const gayak = row.querySelector('td:nth-child(2) span')?.innerText || null;
        const rag = row.querySelector('td:nth-child(3) span')?.innerText || null;
        const prakashak = row.querySelector('td:nth-child(4) span')?.innerText || null;
        const recordingQuality = row.querySelector('td:nth-child(5) span')?.innerText || null;
        const swarkar = row.querySelector('td:nth-child(6) span')?.innerText || null;
        const cdName = row.querySelector('td:nth-child(7) span')?.innerText || null;
        const liveStudio = row.querySelector('td:nth-child(8) span')?.innerText || null;
        const audioVideo = row.querySelector('td:nth-child(9) span')?.innerText || null;
        const rating = row.querySelector('td:nth-child(10) div')?.innerText || null;

        // Only add non-null data
        if (audioLink || gayak || rag || prakashak || recordingQuality || swarkar || cdName || liveStudio || audioVideo || rating) {
          audioVideoData.push({
            audioLink,
            gayak,
            rag,
            prakashak,
            recordingQuality,
            swarkar,
            cdName,
            liveStudio,
            audioVideo,
            rating
          });
        }
      });

      return {
        kirtanName: document.querySelector('#ctl00_ContentPlaceHolder1_tdKirtanName')?.innerText || null,
        full_kirtan: document.querySelector('#pagecontent > table:nth-child(7) > tbody > tr:nth-child(3) > td')?.innerText || null,
        mul_pad: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanPadBody')?.innerText || null,
        malta_rag: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanMaltaRagBody')?.innerText || null,
        creator: document.querySelector('#ctl00_ContentPlaceHolder1_tdKirtanGayakBody')?.innerText || null,
        non_stop_kirtan: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanPrakashakHeader')?.innerText || null,
        utpati: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanBhashantarHeader')?.innerText || null,
        vivechan: document.querySelector('#ctl00_ContentPlaceHolder1_tdHKirtanVivechakHeader')?.innerText || null,
        photo: document.querySelector('#ctl00_ContentPlaceHolder1_DataList1 > tbody > tr > td:nth-child(1) > table > tbody > tr > td img')?.src || null,
        audio_and_video: JSON.stringify(audioVideoData) // Store as JSON string
      };
    });

    return data;
  } catch (error) {
    console.error(`Failed to scrape data for Kid: ${kid}`, error);
    return null; // Return null in case of an error
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function processKidFile() {
  const kidFilePath = path.join(__dirname, 'kid_values.csv');
  const xlsxFilePath = path.join(__dirname, 'kirtan_data.xlsx');

  // Initialize an array to hold all data
  const kirtanDataArray = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(kidFilePath),
    crlfDelay: Infinity
  });

  for await (const kid of rl) {
    if (kid.trim()) {
      console.log(`Processing Kid: ${kid}`);
      const kirtanData = await scrapeKirtanData(kid.trim());
      if (kirtanData) {
        kirtanDataArray.push(kirtanData);
      } else {
        console.log(`Skipping Kid: ${kid} due to an error.`);
      }
    }
  }

  // Write the data to an Excel file
  const worksheet = xlsx.utils.json_to_sheet(kirtanDataArray);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Kirtan Data');
  xlsx.writeFile(workbook, xlsxFilePath);

  console.log(`Data has been written to ${xlsxFilePath}`);
}

processKidFile().catch(console.error);
