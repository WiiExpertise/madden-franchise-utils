const FranchiseUtils = require("../Utils/FranchiseUtils");
const { getBinaryReferenceData } = require("madden-franchise").utilService;
const gameYear = FranchiseUtils.YEARS.M26;
// This uses the franchise-tuning-binary.FTC file
const franchise = FranchiseUtils.init(gameYear, { isFtcFile: true, promptForBackup: false });

franchise.on("ready", async function () {
  const stadiumArrayTable = franchise.getTableByUniqueId(4229567840);
  await FranchiseUtils.readTableRecords([stadiumArrayTable]);

  const allAssets = franchise.assetTable;
  const record = stadiumArrayTable.records[1]; // Second row has SB stadiums
  const columns = FranchiseUtils.getColumnNames(stadiumArrayTable);

  const results = [];

  for (const col of columns) {
    const value = record[col];
    if (value === FranchiseUtils.ZERO_REF) continue;

    const { row, tableId } = FranchiseUtils.getRowAndTableIdFromRef(value);

    // Convert that target row into its FTC asset binary
    const binRef = getBinaryReferenceData(tableId, row);
    const assetRef = FranchiseUtils.bin2Dec(binRef);
    const assetId = allAssets.find((a) => a.reference === assetRef)?.assetId;

    if (assetId === undefined) {
      console.warn(`No matching asset found for column ${col} (row ${row}, tableId ${tableId})`);
      continue;
    }

    const finalBin = FranchiseUtils.dec2bin(assetId, 2);
    results.push(finalBin);
  }

  console.log(results);
});
