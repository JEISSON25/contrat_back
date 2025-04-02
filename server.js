// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configura el cliente de S3 usando las variables de entorno
const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Endpoint para generar la URL pre-firmada
app.post('/generate-presigned-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ message: 'Faltan fileName o contentType' });
    }

    // Genera una clave única para el archivo. Puedes ajustar el folder según tu necesidad.
    const key = `documents/${Date.now()}-${fileName}`;
    
    // Crea el comando de PutObject
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });
    
    // Genera la URL pre-firmada (válida por 1 hora, por ejemplo)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    res.json({ signedUrl, key });
  } catch (error) {
    console.error('Error al generar la URL pre-firmada:', error);
    res.status(500).json({ message: 'Error al generar la URL pre-firmada', error: error.message });
  }
});

// Inicia el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
