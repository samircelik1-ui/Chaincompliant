// ChainCompliant — backend reale

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve automaticamente i file presenti nella cartella del progetto
app.use(express.static(__dirname));

// Quando apri http://localhost:3001 mostra chaincompliant.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chaincompliant.html'));
});

// ---------------------------------------------------------------
// EMAIL
// ---------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

app.post('/api/notify', async (req, res) => {

  const { address } = req.body;

  if (!address) {
    return res.status(400).json({
      error: 'address mancante'
    });
  }

  try {

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.NOTIFY_EMAIL_TO,
      subject: 'Nuova richiesta di verifica AML — ChainCompliant',
      text:
`È arrivata una nuova richiesta di verifica.

Wallet:
${address}

Data:
${new Date().toISOString()}`
    });

    res.json({ ok: true });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'invio email fallito'
    });

  }

});

// ---------------------------------------------------------------
// AML CHECK
// ---------------------------------------------------------------

const AML_API_URL = process.env.AML_API_URL;
const AML_API_KEY = process.env.AML_API_KEY;

app.post('/api/aml-check', async (req, res) => {

  const { address } = req.body;

  if (!address) {
    return res.status(400).json({
      error: 'address mancante'
    });
  }

  if (!AML_API_URL || !AML_API_KEY) {

    return res.status(500).json({
      error: 'Provider AML non configurato. Configura il file .env'
    });

  }

  try {

    const response = await fetch(AML_API_URL, {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${AML_API_KEY}`
      },

      body: JSON.stringify({
        address
      })

    });

    if (!response.ok) {

      const text = await response.text();

      console.error(text);

      return res.status(502).json({
        error: 'Errore del provider AML'
      });

    }

    const data = await response.json();

    const riskScore =
      data.risk_score ??
      data.score ??
      null;

    const status =
      riskScore === null
        ? 'unknown'
        : riskScore >= 75
          ? 'high_risk'
          : riskScore >= 25
            ? 'review'
            : 'ok';

    res.json({

      demo: false,

      address,

      score: riskScore,

      status,

      note:
        data.description ||
        'Esito ricevuto dal provider.'

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: 'Verifica non riuscita'
    });

  }

});

// ---------------------------------------------------------------

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {

  console.log(`Server attivo su http://localhost:${PORT}`);

});