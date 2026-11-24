import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { isPlainString, isValidEmail, hasNoSqlOperators } from '../utils/validators.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    if (hasNoSqlOperators(req.body)) return res.status(400).json({ error: 'Invalid payload.' });
    const { name, email, subject, message } = req.body || {};
    if (!isPlainString(name, 2, 100)) return res.status(400).json({ error: 'Name is required.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Valid email is required.' });
    if (!isPlainString(subject, 3, 150)) return res.status(400).json({ error: 'Subject is required.' });
    if (!isPlainString(message, 10, 2000)) {
      return res.status(400).json({ error: 'Message must be at least 10 characters.' });
    }

    const saved = await dataStore.createContactMessage({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(201).json({ message: 'Your message has been received by CineFlix support.', id: saved._id });
  } catch {
    return res.status(500).json({ error: 'Failed to submit contact form.' });
  }
});

export default router;
