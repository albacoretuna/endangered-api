'use strict';
require('dotenv').config();
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary');

const { sample, get, isFinite } = require('lodash');
const Promise = require('bluebird');

// list of our images on cloudinary
let availableImages = [];

// maximum dimensions we support
const MAX_WIDTH = 1000;
const MAX_HEIGHT = 1200;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getImageList = () => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.api.resources((error, result) => {
      if (error) return reject(error);
      return resolve(result.resources);
    });
  });
};

const updateAvailableImages = async () => {
  let resources = [];
  try {
    resources = await getImageList();
    availableImages = resources
      .filter(image => image.public_id !== 'sample')
      .map(image => {
        return {
          ...image,
          ratio: parseFloat(
            parseFloat(image.width) / parseFloat(image.height),
          ).toFixed(3),
        };
      });
  } catch (e) {
    throw new Error(e);
  }
};

updateAvailableImages();

const findClosestRatio = (width, height, availableImages) => {
  if (!isFinite(width) || !isFinite(height) || !availableImages[0]) return;

  const desiredRatio = parseFloat(width / height);

  return availableImages.reduce(
    (prev, curr) =>
      Math.abs(curr.ratio - desiredRatio) < Math.abs(prev.ratio - desiredRatio)
        ? curr
        : prev,
  );
};

router.get('/', (req, res, next) => {
  res.json({ title: 'Endangered.photo' });
  next();
});

router.get('/:width/:height', (req, res, next) => {
  let { width, height } = req.params;
  width = parseInt(width, 10)
  height = parseInt(height, 10)

  if (!isFinite(width) || !isFinite(height)) {
    return res.status(404).send('Invalid photo size');
  }

  width = width > MAX_WIDTH ? MAX_WIDTH : width;
  height = height > MAX_HEIGHT ? MAX_HEIGHT : height;

  const closestRatio = findClosestRatio(width, height, availableImages);

  if (!closestRatio) return res.status(404).send('Image not found');

  const imageUrl = cloudinary.url(closestRatio.public_id, {
    secure: true,
    width: width,
    height: height,
    crop: 'pad',
    background: 'lightgrey',
    sign_url: true,
  });

  res.redirect(imageUrl);
});

const getRandomImage = availableImages =>
  get(sample(availableImages), 'public_id');

router.get('/:width', (req, res, next) => {
  let { width } = req.params;
  width = parseInt(width, 10)

  if (!isFinite(width)) {
    return res.status(404).send('Invalid photo width');
  }

  width = width > MAX_WIDTH ? MAX_WIDTH : width;

  const imageUrl = cloudinary.url(getRandomImage(availableImages), {
    secure: true,
    width: width,
    sign_url: true,
  });

  if (!imageUrl) return res.status(404).send('Image not found');

  res.redirect(imageUrl);
});

module.exports = router;
