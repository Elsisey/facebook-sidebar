function onOpen() {
  SpreadsheetApp.getUi().createMenu("📘 Facebook Ads")
    .addItem("📊 Open Campaign Report", "showSidebar")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("Facebook Campaigns")
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function fetchCampaigns(range, customStart, customEnd, limit, fields, filters) {
  if (!range || typeof range !== "string") range = "last_3_days";
  if (!Array.isArray(fields)) fields = ["id", "name", "status"];
  if (!limit || typeof limit !== "number") limit = 10;
  if (!Array.isArray(filters)) filters = [];

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

  const baseUrl = `https://graph.facebook.com/v19.0/act_${adAccountId}/campaigns`;

  const params = {
    fields: fields.join(","),
    limit: 100, // هات كل البيانات وفلتر يدوي
    access_token: accessToken,
    since: startDate,
    until: endDate
    // ❌ لا ترسل "filtering" هنا
  };

  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  const url = `${baseUrl}?${queryString}`;

  try {
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.clearContents();

    // ✅ فلترة يدوية بعد استلام البيانات
    const filteredData = data.data.filter(item => {
      return filters.every(f => {
        const val = item[f.field];
        return val && val.toString().toLowerCase() === f.value.toLowerCase();
      });
    }).slice(0, limit);

    sheet.appendRow(fields.map(f => f.replace(/_/g, " ").toUpperCase()));

    const rows = filteredData.map(item =>
      fields.map(field => item[field] !== undefined ? item[field] : "")
    );

    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, fields.length).setValues(rows);
    } else {
      sheet.appendRow(["No campaigns match the selected filters."]);
    }

  } catch (error) {
    SpreadsheetApp.getUi().alert("❌ Error: " + error.message);
  }
}
