<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1RvAAHUwtBMgf3P9ZAUNBNPdT6iwDQW9m

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Favicon

- **Place image:** Copy the provided `wallet.png` into the project root (next to `index.html`).
- **Use directly:** The app references `/wallet.png` as the favicon. This works for modern browsers.
- **Create a multi-resolution `.ico` (optional):** If you want a classic `favicon.ico`, install ImageMagick and run:

```
magick wallet.png -resize 64x64 -background transparent -gravity center -extent 64x64 favicon.ico
```

- **Online conversion:** Alternatively use any online PNG→ICO converter and place the resulting `favicon.ico` at the project root.

After placing the file, reload the site and clear the browser cache to see the new favicon.
