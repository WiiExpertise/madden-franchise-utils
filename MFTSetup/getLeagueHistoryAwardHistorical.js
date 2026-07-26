const FranchiseUtils = require("../Utils/FranchiseUtils");

const AWARD_COLUMNS = ["Binary", "teamIdentity", "lastName", "firstName", "AwardType", "Position"];

const gameYear = FranchiseUtils.YEARS.M26;
const ftcFranchise = FranchiseUtils.init(gameYear, { isFtcFile: true, promptForBackup: false });

ftcFranchise.on("ready", async function () {
  const awardTable = ftcFranchise.getTableByUniqueId(2234062019);
  const yearSummaryTable = ftcFranchise.getTableByUniqueId(2508954027);
  const teamIdentityTable = ftcFranchise.getTableByUniqueId(1550665145);
  await FranchiseUtils.readTableRecords([awardTable, yearSummaryTable, teamIdentityTable]);

  const options = {
    includeRow: false,
    includeAssetId: false,
    loadReferenceCols: true,
  };
  const awardArray = await FranchiseUtils.getTableDataAsArray(ftcFranchise, awardTable, options);

  const filteredAwards = awardArray.map((obj) =>
    Object.fromEntries(AWARD_COLUMNS.filter((key) => key in obj).map((key) => [key, obj[key]])),
  );

  const summaryOptions = { includeRow: false, includeAssetId: false, includeBinary: false, loadReferenceCols: true };
  const rawSummary = await FranchiseUtils.getTableDataAsArray(ftcFranchise, yearSummaryTable, summaryOptions);

  const yearSummaryRecords = rawSummary.map((record, index, arr) => ({
    SB_MVP: record.SB_MVP,
    OffensiveROTY: record.OffensiveROTY,
    OffensivePOTY: record.OffensivePOTY,
    NFL_MVP: record.NFL_MVP,
    NFC_Team_Identity: record.NFCTeamIdentity,
    AFC_Team_Identity: record.AFCTeamIdentity,
    DefensiveROTY: record.DefensiveROTY,
    DefensivePOTY: record.DefensivePOTY,
    CoachOfTheYear: record.CoachOfTheYear,
    NFC_SB_USER: FranchiseUtils.ZERO_REF,
    AFC_SB_USER: FranchiseUtils.ZERO_REF,
    AnnualAwards: FranchiseUtils.ZERO_REF,
    NFC_CityName: record.NFC_CityName,
    AFC_CityName: record.AFC_CityName,
    PeriodIndex: -(arr.length - index),
    AFC_TeamLogo: record.AFC_TeamLogo,
    NFC_TeamLogo: record.NFC_TeamLogo,
    NFC_SB_Wins: record.NFC_SB_Wins,
    SB_Index: 0,
    AFC_SB_Score: record.AFC_SB_Score,
    NFC_SB_Score: record.NFC_SB_Score,
    AFC_ConfChamp_Wins: record.AFC_ConfChamp_Wins,
    AFC_SB_Wins: record.AFC_SB_Wins,
    NFC_ConfChamp_Wins: record.NFC_ConfChamp_Wins,
  }));

  const identityOptions = { includeRow: false, includeAssetId: false, includeBinary: true };
  const result = await FranchiseUtils.getTableDataAsArray(ftcFranchise, teamIdentityTable, identityOptions);

  FranchiseUtils.convertArrayToJSONFile(filteredAwards, "LeaguePastAwards.json");
  FranchiseUtils.convertArrayToJSONFile(yearSummaryRecords, "LeaguePastHistory.json");
  FranchiseUtils.convertArrayToJSONFile(result, "TeamIdentity.json");
});
