const FranchiseUtils = require("../../Utils/FranchiseUtils");
const fs = require("fs");
const path = require("path");

const gameYear = FranchiseUtils.YEARS.M26;
const franchise = FranchiseUtils.init(gameYear, { isFtcFile: true, promptForBackup: false });

function writeJSON(data, file) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

franchise.on("ready", async function () {
  const attributes = readJSON(path.join(__dirname, "attributes.json"));
  const attributesByShortName = new Map(attributes.map((attr) => [attr.ShortName, attr]));

  const uiSpreadsheetPositionFilterTable = franchise.getTableByUniqueId(2615630272);
  const uiSpreadsheetDraftPositionRangeFilter = franchise.getTableByUniqueId(2904804832);
  await FranchiseUtils.readTableRecords([uiSpreadsheetPositionFilterTable, uiSpreadsheetDraftPositionRangeFilter]);

  // Resolves a row's Columns array ref into a flat list of matched attribute ShortNames
  async function getMatchedShortNamesForRow(row) {
    const columnsBin = row["Columns"];
    if (!columnsBin || columnsBin === FranchiseUtils.ZERO_REF) return null;

    const { tableId: columnsTableId, row: columnsRowIndex } = FranchiseUtils.getRowAndTableIdFromRef(columnsBin);
    const columnsTable = franchise.getTableById(columnsTableId);
    await FranchiseUtils.readTableRecords([columnsTable]);
    const columnsRow = columnsTable.records[columnsRowIndex];
    const columnsArrayColumns = FranchiseUtils.getColumnNames(columnsTable);

    const matchedShortNames = [];

    for (const arrayCol of columnsArrayColumns) {
      const entryBin = columnsRow[arrayCol];
      if (!entryBin || entryBin === FranchiseUtils.ZERO_REF) continue;

      const { tableId: entryTableId, row: entryRowIndex } = FranchiseUtils.getRowAndTableIdFromRef(entryBin);
      const entryTable = franchise.getTableById(entryTableId);
      await FranchiseUtils.readTableRecords([entryTable]);
      const entryRow = entryTable.records[entryRowIndex];

      const displayName = entryRow["DisplayName"];
      if (!displayName) continue;

      if (attributesByShortName.has(displayName)) {
        matchedShortNames.push(displayName);
      }
    }

    return matchedShortNames;
  }

  const result = {};

  // "All" row
  const allRow = uiSpreadsheetDraftPositionRangeFilter.records[2];
  const allShortNames = await getMatchedShortNamesForRow(allRow);
  if (allShortNames) {
    result["All"] = allShortNames;
  }

  // Per-position rows
  for (let i = 0; i <= 35; i++) {
    const positionRow = uiSpreadsheetPositionFilterTable.records[i];
    if (!positionRow) continue;

    const columnsBin = positionRow["Columns"];
    if (!columnsBin || columnsBin === FranchiseUtils.ZERO_REF) continue;

    const positionKey = positionRow["Value"];
    const shortNames = await getMatchedShortNamesForRow(positionRow);
    if (shortNames) {
      result[positionKey] = shortNames;
    }
  }

  writeJSON(result, "AttributesByPosition.json");
  console.log(`Done writing AttributesByPosition.json (${Object.keys(result).length} keys)`);
});
