function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  var data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet1 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  var sheet2 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet2");
  var data = JSON.parse(e.postData.contents);

  if (data.action === 'updatePlayerInfo') {
    // Ghi thông tin người chơi vào Sheet 2
    var playerInfo = data.playerInfo;
    var lastRow = sheet2.getLastRow();
    var newRow = lastRow + 1;

    sheet2.getRange(newRow, 1).setValue(lastRow); // STT
    sheet2.getRange(newRow, 2).setValue(playerInfo.name); // TÊN KHÁCH HÀNG
    sheet2.getRange(newRow, 3).setValue(playerInfo.address); // ĐỊA CHỈ
    sheet2.getRange(newRow, 4).setValue(playerInfo.phone); // SỐ ĐIỆN THOẠI
    sheet2.getRange(newRow, 5).setValue(playerInfo.facebook); // FACEBOOK
    sheet2.getRange(newRow, 6).setValue(playerInfo.zalo); // ZALO
    sheet2.getRange(newRow, 7).setValue(playerInfo.prize); // TRÚNG GIẢI

    return ContentService.createTextOutput("Player info updated")
      .setMimeType(ContentService.MimeType.TEXT);
  } else {
    // Cập nhật số lượng giải thưởng trong Sheet 1
    var rows = sheet1.getDataRange().getValues();
    
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === data.prizeName) {
        sheet1.getRange(i + 1, 3).setValue(data.newQuantity);
        break;
      }
    }
    return ContentService.createTextOutput("Success")
      .setMimeType(ContentService.MimeType.TEXT);
  }
}