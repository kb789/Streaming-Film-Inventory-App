const async = require('async');
const formidable = require('formidable');
const path = require('path');
var fs = require('fs');
const mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

const Category = require('../models/category');
var Film = require('../models/film');
const { fieldValidator } = require('../utils/index');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CN,
  api_key: process.env.APIKEY,
  api_secret: process.env.APISECRET,
});

const uploadImage = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath);

    return result.url;
  } catch (error) {
    console.error(error);
  }
};

exports.index = function (req, res) {
  Film.count().exec(function (err, count) {
    var random = Math.floor(Math.random() * count);
    Film.findOne()
      .skip(random)
      .exec(function (err, result) {
        if (err) {
          return res.status(400).json({
            success: false,
            error: err,
          });
        }

        res.render('pages/index', { result: result });
      });
  });
};

// GET add new film form
exports.createForm = function (req, res) {
  async.parallel(
    {
      categories: function (callback) {
        Category.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err,
        });
      }

      res.render('pages/filmForm', {
        title: 'Film Inventory',
        categories: results.categories,
      });
    }
  );
};

// POST add new film form
exports.create = (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        status: 'Fail',
        message: 'There was an error parsing the files',
        error: err,
      });
    }
    const { name, director, price, availability, category } = fields;
    if (fieldValidator(fields)) {
      return res.status(400).json(fieldValidator(fields));
    }

    const file = await files.myFile;

    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'no file uploaded',
      });
    }

    if (
      file.mimetype !== 'image/jpeg' &&
      file.mimetype !== 'image/gif' &&
      file.mimetype !== 'image/png'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload a jpeg, gif or png file',
      });
    }

    var oldPath = file._writeStream.path;

    const fullpath = await uploadImage(oldPath);

    var film = new Film({
      name: name,
      director: director,
      price: price,
      availability: availability,
      category: category,
      image: fullpath,
    });

    try {
      film.save(function (err) {
        if (err) {
          return res.status(400).json({
            success: false,
            error: err,
          });
        }
        Film.find({}, 'name director availability')
          .sort({ name: 1 })
          .exec(function (err, list_films) {
            if (err) {
              return res.status(400).json({
                success: false,
                error: err,
              });
            }

            res.render('pages/film_list', {
              film_list: list_films,
            });
          });
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
  });
};

// Get Film detail page
exports.filmDetail = function (req, res) {
  const promise = Film.find({ _id: req.params.id }).exec();

  promise.then(function (docs) {
    Category.find({ _id: docs[0].category.toString() }).exec(function (
      err,
      cats
    ) {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err,
        });
      }

      res.render('pages/film_detail', {
        film: docs[0],

        category: cats[0].name,
        image: docs[0].image,
      });
    });
  });
};

exports.filmEditForm = function (req, res) {
  const promise = Film.find({ _id: req.params.id }).exec();

  promise.then(function (docs) {
    Category.find().exec(function (err, cats) {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err,
        });
      }

      res.render('pages/filmFormEdit', {
        film: docs[0],
        categories: cats,

        image: '/' + docs[0].image,
      });
    });
  });
};

exports.editForm = (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        status: 'Fail',
        message: 'There was an error parsing the files',
        error: err,
      });
    }
    const { name, director, price, availability, category, film_id } = fields;
    if (fieldValidator(fields)) {
      return res.status(400).json(fieldValidator(fields));
    }

    const file = await files.myFile;

    if (file.size !== 0) {
      if (
        file.mimetype !== 'image/jpeg' &&
        file.mimetype !== 'image/gif' &&
        file.mimetype !== 'image/png'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Please upload a jpeg, gif or png file',
        });
      }

      var oldPath = file._writeStream.path;
      const fullpath = await uploadImage(oldPath);

      update = {
        name: name,
        director: director,
        price: price,
        availability: availability,
        category: category,
        image: fullpath,
      };
    } else {
      update = {
        name: name,
        director: director,
        price: price,
        availability: availability,
        category: category,
      };
    }

    const filter = {
      _id: film_id,
    };

    Film.findOneAndUpdate(filter, update, null, function (err, result) {
      if (err) {
        return err;
      }
    });
    res.redirect('/film/' + film_id);
  });
};

exports.delete_film = function (req, res) {
  Film.findByIdAndRemove(req.params.id, function (err, results) {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err,
      });
    }
    return res.redirect('/films');
  });
};

exports.filmCategory = function (req, res) {
  Film.find({ category: [new ObjectId(req.params.id)] }).exec(function (
    err,
    cat_films
  ) {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err,
      });
    }

    res.render('pages/catfilm', {
      cat_films: cat_films,
    });
  });
};

// GET request for list of all film items.

exports.searchFilms = function (req, res) {
  Film.find({ name: { $regex: req.body.term, $options: 'i' } }).exec(function (
    err,
    result
  ) {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err,
      });
    }
    if (result.length !== 0) {
      return res.render('pages/film_list', {
        film_list: result,
      });
    }
  });
  let term_arr = req.body.term.split(' ');
  for (let i = 0; i < term_arr.length; i++) {
    Film.find({ name: { $regex: term_arr[i], $options: 'i' } }).exec(function (
      err,
      result
    ) {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err,
        });
      }
      if (result.length !== 0) {
        return res.render('pages/film_list', {
          film_list: result,
        });
      }
      res.render('pages/film_list', {
        film_list: [],
      });
    });
  }
};

exports.film_list = function (req, res) {
  Film.find({}, 'name director availability')
    .sort({ name: 1 })
    .exec(function (err, list_films) {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err,
        });
      }

      res.render('pages/film_list', {
        film_list: list_films,
      });
    });
};
