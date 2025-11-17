module.exports = {
  id: "talk-ai-qa-wordpress",
  viewports: [{ name: "desktop", width: 1280, height: 800 }],
  scenarios: [
    { label: "home", url: "http://talk-ai-for-qa-in-wordpress.local/", selectors: ["document"] },
    { label: "pricing", url: "http://talk-ai-for-qa-in-wordpress.local/pricing", selectors: ["document"] },
    { label: "features", url: "http://talk-ai-for-qa-in-wordpress.local/features", selectors: ["document"] }
  ],
  paths: {
    bitmaps_reference: "backstop/bitmaps_reference",
    bitmaps_test: "backstop/bitmaps_test",
    html_report: "backstop/html_report",
    json_report: "backstop/json_report"
  },
  report: ["json","browser"],
  engine: "playwright",
  engineOptions: {
    args: ["--no-sandbox"]
  },
  misMatchThreshold: 0.06
};