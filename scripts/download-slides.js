const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadSlides() {
  const auth = new GoogleAuth({
    keyFile: process.env.SERVICE_ACCOUNT_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/presentations.readonly"],
  });

  const slides = google.slides({ version: "v1", auth });
  const slidesConfig = JSON.parse(process.env.SLIDES_CONFIG);

  for (const config of slidesConfig) {
    const { type, url } = config;

    const presentationId = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/)[1];
    const presentation = await slides.presentations.get({ presentationId });
    await sleep(1000);

    const tempDir = `${process.env.TEMP_DIR}/${type}`;
    await fs.promises.mkdir(tempDir, { recursive: true });

    for (let i = 0; i < presentation.data.slides.length; i++) {
      const response = await slides.presentations.pages.getThumbnail({
        presentationId,
        pageObjectId: presentation.data.slides[i].objectId,
      });

      const imageUrl = response.data.contentUrl;
      const imageResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());

      await fs.promises.writeFile(
        `${tempDir}/slide-${(i + 1).toString().padStart(3, "0")}.png`,
        buffer
      );

      // リクエストの制限を避けるためにスリープ
      await sleep(1000);
    }
  }
}

downloadSlides();
