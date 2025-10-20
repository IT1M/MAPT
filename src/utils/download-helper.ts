/**
 * Download Helper Utility
 * Centralized download functionality with option to disable automatic downloads
 */

// Set to false to disable all automatic downloads
const ENABLE_AUTO_DOWNLOAD = true;

/**
 * Safely download a blob as a file
 * @param blob - The blob to download
 * @param filename - The filename for the download
 * @returns boolean - true if download was triggered, false if disabled
 */
export function downloadBlob(blob: Blob, filename: string): boolean {
  if (!ENABLE_AUTO_DOWNLOAD) {
    console.log(`[Download Disabled] Would download: ${filename}`);
    console.log(`[Download Disabled] Blob size: ${blob.size} bytes`);
    return false;
  }

  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('[Download Error]', error);
    return false;
  }
}

/**
 * Download data as JSON file
 * @param data - The data to download
 * @param filename - The filename for the download
 * @returns boolean - true if download was triggered, false if disabled
 */
export function downloadJSON(data: any, filename: string): boolean {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  return downloadBlob(blob, filename);
}

/**
 * Download text as CSV file
 * @param csvText - The CSV text to download
 * @param filename - The filename for the download
 * @returns boolean - true if download was triggered, false if disabled
 */
export function downloadCSV(csvText: string, filename: string): boolean {
  const blob = new Blob([csvText], { type: 'text/csv' });
  return downloadBlob(blob, filename);
}
