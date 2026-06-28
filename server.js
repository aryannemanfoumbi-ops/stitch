import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "@gradio/client";
import twilio from "twilio";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const color = { reset: "\x1b[0m", cyan: "\x1b[36m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m" };
const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.static(__dirname));

// ----------------------------------------------------------
// Twilio SMS Verification
// ----------------------------------------------------------
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!TWILIO_ACCOUNT_SID) console.warn("Missing TWILIO_ACCOUNT_SID");
if (!TWILIO_AUTH_TOKEN) console.warn("Missing TWILIO_AUTH_TOKEN");
if (!TWILIO_VERIFY_SERVICE_SID) console.warn("Missing TWILIO_VERIFY_SERVICE_SID");

const twilioClient = twilio(
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN
);
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

// POST /api/send-verification — Send SMS code via Twilio Verify
app.post("/api/send-verification", async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: "Missing phone number" });

        // Strip non-digits for normalization but keep + prefix
        const cleanPhone = phone.replace(/[^\d+]/g, "");
        if (cleanPhone.length < 10) return res.status(400).json({ error: "Invalid phone number" });

        const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
        if (!sid) throw new Error("TWILIO_VERIFY_SERVICE_SID is missing in .env");

        console.log(`${color.cyan}📱 Sending Verify SMS to ${cleanPhone}...${color.reset}`);
        
        await twilioClient.verify.v2.services(sid).verifications.create({to: cleanPhone, channel: 'sms'});
        console.log(`${color.green}✅ Verify SMS sent to ${cleanPhone} via Twilio Verify${color.reset}`);
        
        res.json({ success: true, message: "Verification code sent via Twilio Verify" });
    } catch (err) {
        console.error(`${color.red}❌ Twilio Error: ${err.message}${color.reset}`);
        res.status(500).json({
            error: `SMS failed: ${err.message}`,
            hint: "Check if your Twilio Verify Service SID is valid and account has funds/trial balance."
        });
    }
});

// POST /api/verify-code — Validate the entered code via Twilio Verify
app.post("/api/verify-code", async (req, res) => {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) return res.status(400).json({ error: "Missing phone or code" });

        const cleanPhone = phone.replace(/[^\d+]/g, "");
        const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
        if (!sid) throw new Error("TWILIO_VERIFY_SERVICE_SID is missing in .env");

        const verificationCheck = await twilioClient.verify.v2.services(sid)
            .verificationChecks
            .create({to: cleanPhone, code: code.trim()});
        
        if (verificationCheck.status === 'approved') {
            console.log(`${color.green}✅ Phone ${cleanPhone} verified via Twilio Verify!${color.reset}`);
            res.json({ success: true, verified: true });
        } else {
            return res.status(400).json({ error: "Incorrect code. Please try again." });
        }
    } catch (err) {
        console.error(`${color.red}❌ Verification Error: ${err.message}${color.reset}`);
        res.status(500).json({ error: err.message });
    }
});


// ----------------------------------------------------------
// POST /api/try-hairstyle — HF Space instruct-pix2pix
// ----------------------------------------------------------
app.post("/api/try-hairstyle", async (req, res) => {
    try {
        const { userImageBase64, stylePrompt } = req.body;
        if (!userImageBase64) {
            return res.status(400).json({ error: "Missing userImageBase64" });
        }

        const prompt = stylePrompt || "Change the hair to neat, long african knotless braids, keeping the face exactly the same, photorealistic";

        // Convert base64 to Blob
        const base64Data = userImageBase64.replace(/^data:image\/\w+;base64,/, "");
        const mimeType = userImageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
        const imageBuffer = Buffer.from(base64Data, "base64");
        const imageBlob = new Blob([imageBuffer], { type: mimeType });

        console.log(`${color.cyan}⚡ Connecting to Hugging Face Instruct-Pix2Pix Space...${color.reset}`);
        
        // Use the official public space for Instruct-Pix2Pix
        const client = await Client.connect("timbrooks/instruct-pix2pix", {
            hf_token: process.env.HUGGINGFACE_TOKEN || undefined
        });

        console.log(`${color.cyan}⚡ Call HF predict with prompt: "${prompt}"...${color.reset}`);
        
        const result = await client.predict("/generate", [
            imageBlob,
            prompt,
            50,               // Steps
            "Randomize Seed", // randomize_seed
            1371,             // seed
            "Fix CFG",        // randomize_cfg
            9.0,              // text_cfg_scale
            1.2               // image_cfg_scale
        ]);

        console.log(`${color.green}⚡ Generate success. Checking results...${color.reset}`);

        // Extract output image from the correct output position (index 3 for edited image)
        const outputImage = result.data?.[3];
        const outputImageUrl = typeof outputImage === "string" ? outputImage : outputImage?.url;

        if (!outputImageUrl) {
            console.error(`${color.red}❌ Failed to extract image URL from response: ${JSON.stringify(result.data)}${color.reset}`);
            throw new Error("Failed to generate image URL from Hugging Face Space");
        }

        console.log(`${color.green}✅ Generated image URL: ${outputImageUrl}${color.reset}`);
        res.json({ imageUrl: outputImageUrl });

    } catch (err) {
        console.error(`${color.red}❌ Hairstyle Generation Error: ${err.message}${color.reset}`);
        console.error(err);
        res.status(500).json({ error: err.message || "Hairstyle try-on failed." });
    }
});

// ----------------------------------------------------------
// POST /analyze — Anthropic Claude Vision for hairstyle recs
// ----------------------------------------------------------
app.post("/analyze", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) throw new Error("No image uploaded");

        const gender = req.body.gender || "female";
        const imageBase64 = fs.readFileSync(req.file.path, "base64");
        const mimeType = req.file.mimetype || "image/jpeg";

        console.log(`${color.cyan}📸 Image received (${gender})${color.reset}`);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Analyze this person's face shape. Recommend 5 hairstyles that suit them. Return JSON only: { \"recommendations\": [...] }";
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        let parsedJSON;
        try {
            const jsonStr = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
            parsedJSON = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", responseText);
            throw new Error("Failed to parse AI response as JSON");
        }

        // Cleanup uploaded file
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        console.log(`${color.green}✅ Analysis processed${color.reset}`);
        res.json(parsedJSON);

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error(`${color.red}❌ ERROR: ${err.message}${color.reset}`);
        res.status(500).json({ error: err.message || "AI analysis failed." });
    }
});

// ----------------------------------------------------------
// Start server
// ----------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "127.0.0.1", () => {
    console.log(`\x1b[45m 🔥 GLAMATHOME SERVER READY ON PORT ${PORT} \x1b[0m`);
});