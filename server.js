const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Load the HTML content into Cheerio (assuming the HTML is saved in a file)
const htmlContent = fs.readFileSync('./data.html', 'utf8');
const $ = cheerio.load(htmlContent);

// Initialize a Set to store unique "Kid" values
const kidSet = new Set();

// Iterate through each anchor tag in the table to extract the "Kid" value
$('table#ctl00_ContentPlaceHolder1_grdkirtan a').each((index, element) => {
    const href = $(element).attr('href');
    const kidMatch = href.match(/Kid=(\d+)/);
    if (kidMatch) {
        kidSet.add(kidMatch[1]); // Add value to the Set
    }
});

// Convert the Set back to an array
const kidArray = [...kidSet];

// Convert array to CSV format
const csvContent = kidArray.join('\n') +","+ '\n'; // Add newline at the end

// Define the file path for the CSV file
const filePath = path.join(__dirname, 'kid_values.csv');

// Append the CSV content to the existing file or create a new file if it doesn't exist
fs.appendFileSync(filePath, csvContent, 'utf8');

// Output success message
console.log(`Data has been appended to the CSV file at ${filePath}`);
