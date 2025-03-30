function doGet(e) {
  var masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var userId = e.parameter.userId;
  var token = e.parameter.token;

  if (!userId || !token) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Missing userId or token" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var userData = masterSheet.getDataRange().getValues();
  for (var i = 1; i < userData.length; i++) {
    if (userData[i][0] === userId && userData[i][4] === token) {
      var apiUrl = userData[i][3];
      var response = UrlFetchApp.fetch(apiUrl + "?action=getData", {
        method: "get",
        headers: { "Authorization": "Bearer " + token }
      });
      return ContentService.createTextOutput(response.getContentText())
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid userId or token" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
  var userId = e.parameter.userId;
  var token = e.parameter.token;
  var data = JSON.parse(e.postData.contents);

  if (!userId || !token) {
    return ContentService.createTextOutput("Missing userId or token")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  var userData = masterSheet.getDataRange().getValues();
  for (var i = 1; i < userData.length; i++) {
    if (userData[i][0] === userId && userData[i][4] === token) {
      var apiUrl = userData[i][3];
      var response = UrlFetchApp.fetch(apiUrl, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(data),
        headers: { "Authorization": "Bearer " + token }
      });
      return ContentService.createTextOutput(response.getContentText())
        .setMimeType(ContentService.MimeType.TEXT);
    }
  }
  
  return ContentService.createTextOutput("Invalid userId or token")
    .setMimeType(ContentService.MimeType.TEXT);
}