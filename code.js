function onOpen() {
  SpreadsheetApp.getUi().createMenu("📘 Facebook Ads")
    .addItem("📊 Open Campaign Report", "showSidebar")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("Facebook Campaigns")
    .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

function fetchCampaigns(range, customStart, customEnd, limit, fields) {
  if (!range || typeof range !== "string") range = "last_3_days";
  if (!Array.isArray(fields)) fields = ["id", "name", "status"];
  if (!limit || typeof limit !== "number") limit = 10;

  const accessToken = "EAAjvXKFHTesBOZB2OsW4pCiZBsBBMA6wTyObXIsPziu40IGeLWgdMrburh3tvUNC1fLk9AiGsq4tJky4FfVgwwMe0tSpEgyffkVp9ZBuHWSV7EdauxrBFizQJWjfqEKB6AlR5ILMO7AACpeMsyN9FlaIDWIYEs3lGnjLAZCUbb7txMxc7hMCD94ZBUOc1yVNLgcsBSQrpcIZAcST5L6WPGMPCJ";
  const adAccountId = "358561038898295";

  let startDate = "", endDate = "";
  const today = new Date();

  if (range.startsWith("last_")) {
    const days = parseInt(range.replace("last_", "").replace("_days", ""));
    const from = new Date(today);
    from.setDate(today.getDate() - days);
    startDate = from.toISOString().slice(0, 10);
    endDate = today.toISOString().slice(0, 10);
  } else {
    startDate = customStart;
    endDate = customEnd;
  }

  const selectedFields = fields.join(",");
  const url = `https://graph.facebook.com/v19.0/act_${adAccountId}/campaigns?fields=${selectedFields}&limit=${limit}&access_token=${accessToken}`;

  try {
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.clearContents();

    sheet.appendRow(fields.map(f => f.replace(/_/g, " ").toUpperCase()));

    const rows = data.data.map(item =>
      fields.map(field => item[field] !== undefined ? item[field] : "")
    );

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, fields.length).setValues(rows);
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert("❌ Error: " + error.message);
  }
}
