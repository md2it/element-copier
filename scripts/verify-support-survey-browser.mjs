import assert from "node:assert/strict";

const moduleUrl = new URL("../extension/app/support-survey/constants.js", import.meta.url).href;

async function withGlobals(globals, run) {
  const keys = ["chrome", "browser", "navigator"];
  const previous = Object.fromEntries(keys.map((key) => [key, globalThis[key]]));
  for (const key of keys) {
    delete globalThis[key];
  }
  Object.assign(globalThis, globals);
  try {
    const mod = await import(`${moduleUrl}?t=${Date.now()}-${Math.random()}`);
    return await run(mod);
  } finally {
    for (const key of keys) {
      delete globalThis[key];
    }
    for (const [key, value] of Object.entries(previous)) {
      if (value !== undefined) globalThis[key] = value;
    }
  }
}

await withGlobals(
  {
    chrome: { runtime: { getURL: (path) => `chrome-extension://id${path}` } }
  },
  (mod) => {
    assert.equal(mod.isFirefoxExtensionRuntime(), false);
    assert.equal(mod.getSupportSurveyStoreListingUrl(), mod.SUPPORT_SURVEY_CHROME_STORE_URL);
    assert.equal(mod.getSupportSurveyStoreRateLabel(), "Rate in Chrome web store");
  }
);

{
  const chromeApi = { runtime: { getURL: (path) => `chrome-extension://id${path}` } };
  const browserApi = { runtime: { getURL: (path) => `chrome-extension://id${path}` } };
  assert.notEqual(browserApi, chromeApi);
  await withGlobals({ chrome: chromeApi, browser: browserApi }, (mod) => {
    assert.equal(mod.isFirefoxExtensionRuntime(), false);
    assert.equal(mod.getSupportSurveyStoreListingUrl(), mod.SUPPORT_SURVEY_CHROME_STORE_URL);
  });
}

await withGlobals(
  {
    browser: { runtime: { getURL: (path) => `moz-extension://id${path}` } },
    chrome: { runtime: { getURL: (path) => `moz-extension://id${path}` } }
  },
  (mod) => {
    assert.equal(mod.isFirefoxExtensionRuntime(), true);
    assert.equal(mod.getSupportSurveyStoreListingUrl(), mod.SUPPORT_SURVEY_FIREFOX_STORE_URL);
    assert.equal(mod.getSupportSurveyStoreRateLabel(), "Rate in Firefox store");
  }
);

await withGlobals(
  {
    navigator: {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0"
    }
  },
  (mod) => {
    assert.equal(mod.isFirefoxExtensionRuntime(), true);
    assert.equal(mod.getSupportSurveyStoreListingUrl(), mod.SUPPORT_SURVEY_FIREFOX_STORE_URL);
  }
);

await withGlobals(
  {
    navigator: {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"
    }
  },
  (mod) => {
    assert.equal(mod.isFirefoxExtensionRuntime(), false);
    assert.equal(mod.getSupportSurveyStoreListingUrl(), mod.SUPPORT_SURVEY_CHROME_STORE_URL);
  }
);

console.log("support-survey browser detection checks passed");
