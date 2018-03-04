const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: 'sample',
  api_key: '874837483274837',
  api_secret: 'a676b67565c6767a6767d6767f676fe1'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({ title: 'Express' });
});

router.get('/400/200', function(req, res, next) {
  res.redirect('https://res.cloudinary.com/endangered/image/upload/v1520200401/pangolin.jpg');
});

module.exports = router;
