const express = require('express');
const router = express.Router();

router.get('/registerPage', (req, res) => {
  res.json({message: 'registerPage'});
});

router.post('/register', (req, res) => {
  console.log('/register',req.body);
  res.json({message: 'register'});
});

module.export = router;

