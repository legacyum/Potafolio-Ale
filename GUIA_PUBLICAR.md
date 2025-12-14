# 🚀 Cómo publicar y actualizar tu Portafolio

Ya tienes todo listo para lanzar tu web al mundo usando **GitHub Pages**.

## 1. Subir tus cambios (Guardar en la nube)
Como tienes VS Code, la forma más fácil es:
1. Ve al ícono de **Source Control** (el tercero a la izquierda, parece un grafo).
2. Escribe un mensaje (ej: "Actualización Chatbot").
3. Dale al botón **Commit** (o "Sync Changes").
4. Si te pide confirmar, dale "OK".

O si prefieres la terminal, ejecuta:
```bash
git add .
git commit -m "Actualización del Portafolio"
git push
```

## 2. Hacerlo visible (GitHub Pages)
1. Entra a tu repositorio en GitHub: [https://github.com/legacyum/Aprendiendo-github](https://github.com/legacyum/Aprendiendo-github)
2. Ve a la pestaña **Settings** (Configuración) > **Pages** (en el menú lateral).
3. En "Branch", elige **main** o **master** y dale **Save**.
4. Espera unos minutos y tu web estará viva en:  
   👉 **https://legacyum.github.io/Aprendiendo-github/**

## 3.  🚨 MUY IMPORTANTE: Protege tu IA
Como tu API Key está en el código (`js/main.js`), es pública. Para que nadie te la robe y gaste tu cuota:
1. Ve a [Google AI Studio / Cloud Console](https://aistudio.google.com/app/apikey).
2. Busca tu clave (`AIza...`).
3. Dale a **Edit API key**.
4. En **API restrictions**, elige "No restrictions" (o selecciona Generative Language API).
5. En **Application restrictions** (lo importante), elige **Websites**.
6. Agrega la dirección de tu web: `https://legacyum.github.io/*` (y también `http://localhost:*` para cuando edites en tu PC).
7. **Guardar**.

---

## 🔁 ¿Cómo subir actualizaciones futuras?
Cada vez que edites algo en tu PC:
1. Haces los cambios.
2. Guardas (`Ctrl + S`).
3. Repites el **Paso 1 (Subir cambios)**.
4. ¡Listo! GitHub actualiza la página automáticamente en unos minutos.
