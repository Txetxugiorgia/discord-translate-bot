require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Verificar que las variables de entorno están cargadas
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;
const AZURE_TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT;

if (!DISCORD_TOKEN) {
    console.error("❌ ERROR: No se encontró DISCORD_TOKEN en .env");
    process.exit(1);
}
if (!AZURE_TRANSLATOR_KEY || !AZURE_TRANSLATOR_REGION || !AZURE_TRANSLATOR_ENDPOINT) {
    console.error("❌ ERROR: Faltan configuraciones en el .env (Azure Translator)");
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

    let detectedLanguage = 'es';
    let targetLanguage = 'it';
    let flag = '🇮🇹'; // Por defecto, traducimos a italiano

    // Si el mensaje contiene más caracteres en italiano que en español, asumimos que es italiano y lo traducimos a español
    if (message.content.match(/[a-zA-Z]/)) {
        detectedLanguage = 'es';
        targetLanguage = 'it';
        flag = '🇮🇹'; // Traducción al italiano
    } else {
        detectedLanguage = 'it';
        targetLanguage = 'es';
        flag = '🇪🇸'; // Traducción al español
    }

    const translatedText = await translateText(message.content, detectedLanguage, targetLanguage);
    
    // Enviar el mensaje traducido con la bandera
    message.channel.send(`**${message.author.username}:** ${flag} ${translatedText}`);
});

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);
