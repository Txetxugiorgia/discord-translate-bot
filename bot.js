name: Run Discord Bot

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  run-bot:
    runs-on: ubuntu-latest

    steps:
    - name: Clonar el repositorio
      uses: actions/checkout@v3

    - name: Configurar Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Instalar dependencias
      run: npm install

    - name: Crear archivo .env
      run: |
        echo "DISCORD_TOKEN=${{ secrets.DISCORD_TOKEN }}" >> .env
        echo "AZURE_TRANSLATOR_KEY=${{ secrets.AZURE_TRANSLATOR_KEY }}" >> .env
        echo "AZURE_TRANSLATOR_REGION=${{ secrets.AZURE_TRANSLATOR_REGION }}" >> .env
        echo "AZURE_TRANSLATOR_ENDPOINT=${{ secrets.AZURE_TRANSLATOR_ENDPOINT }}" >> .env

    - name: Mantener el bot en ejecución
      run: |
        while true; do
          node bot.js
          echo "⚠️ El bot se ha detenido. Reiniciando en 5 segundos..."
          sleep 5
        done
