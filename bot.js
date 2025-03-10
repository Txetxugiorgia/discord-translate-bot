require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const axios = require('axios');

// Configurar cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Verificar variables de entorno
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION;
const AZURE_TRANSLATOR_ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT;

if (!DISCORD_TOKEN || !AZURE_TRANSLATOR_KEY || !AZURE_TRANSLATOR_REGION || !AZURE_TRANSLATOR_ENDPOINT) {
    console.error("❌ ERROR: Faltan configuraciones en el .env");
    process.exit(1);
}

// Función para detectar el idioma
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

// Evento de mensaje
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const detectedLanguage = await detectLanguage(message.content);
    if (!detectedLanguage) return;

    let targetLanguage = detectedLanguage === 'es' ? 'it' : 'es';
    let flag = detectedLanguage === 'es' ? '🇮🇹' : '🇪🇸';

    const translatedText = await translateText(message.content, detectedLanguage, targetLanguage);

    message.channel.send(`**${message.author.username}:** ${flag} ${translatedText}`);
});

// Evento cuando el bot se conecta
client.once(Events.ClientReady, () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// 🔄 **Auto-reconexión en caso de errores o desconexión**
client.on('error', (error) => {
    console.error("❌ Error detectado:", error);
    console.log("🔄 Intentando reconectar...");
    reconnectBot();
});

client.on('disconnect', () => {
    console.log("⚠️ El bot se ha desconectado. Intentando reconectar...");
    reconnectBot();
});

// Función para reconectar
function reconnectBot() {
    setTimeout(() => {
        client.login(DISCORD_TOKEN).catch(err => {
            console.error("❌ Error al intentar reconectar:", err);
            reconnectBot(); // Si falla, vuelve a intentar reconectar
        });
    }, 5000); // Reintenta después de 5 segundos
}

// Iniciar el bot
client.login(DISCORD_TOKEN).catch(err => {
    console.error("❌ Error al iniciar sesión:", err);
    reconnectBot();
});
