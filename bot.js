require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Verificar variables de entorno
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;
const AZURE_TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT;

if (!DISCORD_TOKEN || !AZURE_TRANSLATOR_KEY || !AZURE_TRANSLATOR_REGION || !AZURE_TRANSLATOR_ENDPOINT) {
    console.error("❌ ERROR: Faltan configuraciones en el .env");
    process.exit(1);
}

// Configurar el cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Función para detectar el idioma automáticamente
async function detectLanguage(text) {
    try {
        const response = await axios.post(
            `${AZURE_TRANSLATOR_ENDPOINT}/detect?api-version=3.0`,
            [{ Text: text }],
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
                    'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data[0].language;
    } catch (error) {
        console.error("❌ Error detectando el idioma:", error.response ? error.response.data : error.message);
        return null;
    }
}

// Función para traducir el texto
async function translateText(text, from, to) {
    try {
        const response = await axios.post(
            `${AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=${from}&to=${to}`,
            [{ Text: text }],
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
                    'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_REGION,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data[0].translations[0].text;
    } catch (error) {
        console.error("❌ Error en la traducción:", error.response ? error.response.data : error.message);
        return text;
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignorar mensajes de bots

    const detectedLanguage = await detectLanguage(message.content);
    if (!detectedLanguage) return; // Si no se detecta el idioma, no hacer nada

    let targetLanguage = detectedLanguage === 'es' ? 'it' : 'es';
    let flag = detectedLanguage === 'es' ? '🇮🇹' : '🇪🇸';

    const translatedText = await translateText(message.content, detectedLanguage, targetLanguage);
    
    // Enviar el mensaje traducido con la bandera
    message.channel.send(`**${message.author.username}:** ${flag} ${translatedText}`);
});

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);
