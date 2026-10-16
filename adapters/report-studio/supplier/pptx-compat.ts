import JSZip from 'jszip';

/** Fixed PptxGenJS 4.0.1 emits an invalid trailing apostrophe in chart table ranges.
 * Repair only that serializer defect in the exported copy; never rewrite a deck
 * or drop chart/workbook parts. Keynote 14.4 otherwise discards the native chart.
 */
export async function repairChartTableRanges(artifact: Buffer): Promise<Buffer> {
  const deck = await JSZip.loadAsync(artifact);
  let changed = false;
  for (const [name, part] of Object.entries(deck.files)) {
    if (part.dir || !/^ppt\/embeddings\/Microsoft_Excel_Worksheet\d+\.xlsx$/.test(name)) continue;
    const workbook = await JSZip.loadAsync(await part.async('nodebuffer'));
    let workbookChanged = false;
    for (const [tableName, table] of Object.entries(workbook.files)) {
      if (table.dir || !/^xl\/tables\/table\d+\.xml$/.test(tableName)) continue;
      const before = await table.async('string');
      const after = before.replace(/(<table\b[^>]*\bref=")([A-Z]+[1-9]\d*:[A-Z]+[1-9]\d*)'(")/g, '$1$2$3');
      if (after === before) continue;
      workbook.file(tableName, after);
      workbookChanged = true;
    }
    if (!workbookChanged) continue;
    deck.file(name, await workbook.generateAsync({type: 'nodebuffer'}));
    changed = true;
  }
  return changed ? deck.generateAsync({type: 'nodebuffer'}) : artifact;
}
