const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const API_URL = "https://libretranslate.com/translate";
const BOT_TOKEN = process.env.BOT_TOKEN;

client.on("ready", () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  let text = message.content;
  let lang = "";

  // Detectar si el mensaje está en español o italiano
  if (/[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(text)) {
    lang = "es";
  } else {
    lang = "it";
  }

  let targetLang = lang === "es" ? "it" : "es";

  try {
    let response = await axios.post(API_URL, {
      q: text,
      source: lang,
      target: targetLang,
    });

    let translatedText = response.data.translatedText;
    message.reply(`🌍 ${translatedText}`);
  } catch (error) {
    console.error("❌ Error en la traducción", error);
  }
});

client.login(BOT_TOKEN);
