// Required modules
const fs = require('fs');
const FranchiseUtils = require('../Utils/FranchiseUtils');
const { tables } = require('../Utils/FranchiseTableId');
const commentaryLookup = JSON.parse(fs.readFileSync('../Utils/JsonLookups/commentary_lookup.json', 'utf8'));
const presentationIdLookup = JSON.parse(fs.readFileSync('presentationIdLookup.json', 'utf8'));

// Print tool header message
console.log("This program will generate Presentation IDs/Commentary IDs/Asset Names for Draft Class players. This is only for Madden 24 Franchise Files.")

const gameYear = FranchiseUtils.YEARS.M24;
const franchise = FranchiseUtils.selectFranchiseFile(gameYear);

function removeSuffixes(name) {
    return name.replace(/\s+(Jr\.?|Sr\.?|III|II|IV|V)$/g, '');
}

franchise.on('ready', async function () {

    FranchiseUtils.validateGameYears(franchise,gameYear);
    
    const playerTable = franchise.getTableByUniqueId(tables.playerTable);
    await playerTable.readRecords();
	
	// Number of rows in the player table
    const numRows = playerTable.header.recordCapacity; 
    var currentPresentationId = presentationIdLookup['PresentationId']; //Change this value in the json if needed
    console.log(`Initial presentation ID is: ${currentPresentationId}`);
	
	// Iterate through the player table
    for (i = 0; i < numRows; i++) 
	{ 
        // If it's an empty row or invalid player, skip this row
		if (playerTable.records[i].isEmpty || playerTable.records[i]['ContractStatus'] !== 'Draft')
		{
			continue;
        }
        const firstName = playerTable.records[i]['FirstName'];
        const lastName = playerTable.records[i]['LastName'];
        let commentId;
        let hasAssetId = false

        // Remove specified characters from the first name and last name
        const cleanedFirstName = firstName.replace(/[.'`\- ]/g, '');
        const cleanedLastName = lastName.replace(/[.'`\- ]/g, '');

        //If an existing asset name, we don't need to get a new presentation ID
        if (playerTable.records[i]['PLYR_ASSETNAME'] !== '') {
            hasAssetId = true;
        }
        else { // Else, set the current presentation ID
            playerTable.records[i]['PresentationId'] = currentPresentationId;
            console.log(`${firstName} ${lastName}`)
        }

        //We'll ALWAYS generate a new asset name (what if their name has changed, etc)
        playerTable.records[i]['PLYR_ASSETNAME'] = `${cleanedLastName}${cleanedFirstName}_${playerTable.records[i]['PresentationId']}`;

        // Check if the exact last name exists in the commentaryLookup
        if (commentaryLookup.hasOwnProperty(lastName)) {
            commentId = commentaryLookup[lastName];
        } else {
            // Exact match not found, try to find a match after removing suffixes
            const lastNameWithoutSuffix = removeSuffixes(lastName);
            if (commentaryLookup.hasOwnProperty(lastNameWithoutSuffix)) {
                commentId = commentaryLookup[lastNameWithoutSuffix];
            } else {
                commentId = 8191;
            }
        }
        playerTable.records[i]['PLYR_COMMENT'] = commentId;

        //Increment our currentPresentationId IF we've used it this loop
        if (!hasAssetId) {
            currentPresentationId++;
        }
    }
	
    // Update the presentationIdLookup JSON with the new currentPresentationId
    console.log(`Final presentation ID is: ${currentPresentationId}`);
    presentationIdLookup['PresentationId'] = currentPresentationId;
    try {
        fs.writeFileSync('presentationIdLookup.json', JSON.stringify(presentationIdLookup, null, 2), 'utf8');
    } catch (error) {
        console.log("Error saving presentationIdLookup.json:", error);
    }

	console.log("Generated Asset Names/Presentation IDs/Commentary IDs for all Draft Class Players.");
    await FranchiseUtils.saveFranchiseFile(franchise);
    FranchiseUtils.EXIT_PROGRAM();
  
});
  