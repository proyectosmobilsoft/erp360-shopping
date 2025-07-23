const express = require('express');
const { queryDatabase } = require('./internalDatabase');

const router = express.Router();

router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await queryDatabase('SELECT * FROM suppliers', []);
    res.json(suppliers);
  } catch (error) {
    res.status(500).send('Error fetching suppliers');
  }
});

router.post('/suppliers', async (req, res) => {
  const { name, contact } = req.body;
  try {
    await queryDatabase('INSERT INTO suppliers (name, contact) VALUES ($1, $2)', [name, contact]);
    res.status(201).send('Supplier added');
  } catch (error) {
    res.status(500).send('Error adding supplier');
  }
});

router.put('/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, contact } = req.body;
  try {
    await queryDatabase('UPDATE suppliers SET name = $1, contact = $2 WHERE id = $3', [name, contact, id]);
    res.send('Supplier updated');
  } catch (error) {
    res.status(500).send('Error updating supplier');
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await queryDatabase('DELETE FROM suppliers WHERE id = $1', [id]);
    res.send('Supplier deleted');
  } catch (error) {
    res.status(500).send('Error deleting supplier');
  }
});

module.exports = router;