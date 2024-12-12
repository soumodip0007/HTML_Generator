const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post("/", upload.array("images[]"), (req, res) => {
  const {
    title,
    headingLevel,
    headingText,
    paragraphText,
    additionalParagraphText,
  } = req.body;
  const uploadedFiles = req.files;

  if (!title || !headingLevel || !headingText || !paragraphText) {
    return res.status(400).send("All fields are required.");
  }

  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const publicDir = path.join(__dirname, "../public");
  const filePath = path.join(publicDir, `${sanitizedTitle}.html`);

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  let content = "";
  const headings = Array.isArray(headingLevel) ? headingLevel : [headingLevel];
  const headingTexts = Array.isArray(headingText) ? headingText : [headingText];
  const paragraphs = Array.isArray(paragraphText)
    ? paragraphText
    : [paragraphText];

  headings.forEach((level, index) => {
    const heading = headingTexts[index] || "";
    const paragraph = paragraphs[index] || "";
    const image = uploadedFiles[index]
      ? `/uploads/${uploadedFiles[index].filename}`
      : "#";

    content += `
        <div class="section">
          <${level}>${heading}</${level}>
          <p>${paragraph}</p>
          <a href="${image}" target="_blank">Code</a>
        </div>
        <hr>
      `;
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            ${content}
            <a href="https://github.com/soumodip0007" target="_blank">Github Link</a>
        </div>
    </body>
    </html>
  `;

  fs.writeFile(filePath, htmlContent, (err) => {
    if (err) {
      console.error("Error:", err);
      return res.status(500).send("Error saving the HTML file.");
    }

    res.send(`
      <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HTML File Generated</title>
      <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
      <div class="generate-container">
        <div class="container">
            <div class="success-message">
                <p style="color: #fff">HTML file generated successfully!</p>
                <a href="/${path.basename(
                  filePath
                )}" target="_blank">View the file</a><br>
                <a href="https://github.com/soumodip0007" target="_blank">Github Link</a>
            </div>
        </div>
      </div>
  </body>
  </html>
    `);
  });
});

module.exports = router;
