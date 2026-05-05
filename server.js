import "dotenv/config"; // 1. On charge le fichier .env dès le début
import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import cors from "cors";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());

// 2. On utilise la variable d'environnement ici
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// Le reste de ton code ne change pas...
app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucune image uploadée" });
    }

    const gender = req.body.gender || "female";
    console.log(`📸 Image reçue ! Genre sélectionné : ${gender.toUpperCase()}`);

    const imageAsBase64 = fs.readFileSync(req.file.path, 'base64');
    const imageUrl = `data:${req.file.mimetype};base64,${imageAsBase64}`;

    console.log("👁️ Analyse très précise du visage...");
    
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this photo of a ${gender}. Provide a highly detailed facial description in English: exact skin tone, face shape, jawline, nose shape, lip shape, eye color, and eyebrow shape. DO NOT describe the hair or clothing. Just the bare facial features.` 
            },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ]
    });

    const userDescription = visionResponse.choices[0].message.content;
    console.log("📝 Traits du visage détectés :", userDescription);

    console.log("🎨 Création de l'image par DALL-E...");

    let hairstyle = "stylish African knotless braids";
    if (gender === "male") {
        hairstyle = "a clean, sharp low skin fade haircut with a styled textured top and a neat beard";
    }

    const promptDalle = `A highly realistic, unedited, hyper-detailed photography of a ${gender}. The person MUST have these exact facial features: ${userDescription}. The person is wearing ${hairstyle}. Professional studio lighting, neutral background, looking directly at the camera.`;

    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt: promptDalle,
      n: 1,
      size: "1024x1024",
    });

    fs.unlinkSync(req.file.path);
    console.log("✅ Avatar généré avec succès !");

    res.json({ image: result.data[0].url });

  } catch (err) {
    console.error("❌ Erreur :", err);
    res.status(500).json({ error: "L'IA a échoué" });
  }
});

const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
    console.log("=========================================");
    console.log(`🔥 Serveur PRÊT sur le port ${PORT}`);
    console.log("=========================================");
});

setInterval(() => {
    console.log("💓 Serveur toujours actif...");
}, 10000);