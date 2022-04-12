const async = require("async");
const formidable = require("formidable");
const path = require("path");
var fs = require("fs");
const mongoose = require("mongoose");
var ObjectId = require("mongodb").ObjectID;

const Category = require("../models/category");
var Film = require("../models/film");
const { fieldValidator } = require("../utils/index");

exports.index = function (req, res) {
  Film.count().exec(function (err, count) {
    // Get a random entry
    var random = Math.floor(Math.random() * count);

    // Again query all users but only fetch one offset by our random #
    Film.findOne()
      .skip(random)
      .exec(function (err, result) {
        // Tada! random user

        res.render("pages/index", { result: result });
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

      res.render("pages/filmForm", {
        title: "Film Inventory",
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
        status: "Fail",
        message: "There was an error parsing the files",
        error: err,
      });
    }
    const { name, director, price, availability, category } = fields;
    if (fieldValidator(fields)) {
      return res.status(400).json(fieldValidator(fields));
    }
    // check if file is null
    const file = await files.myFile;

    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        message: "no file uploaded",
      });
    }

    if (
      file.mimetype !== "image/jpeg" &&
      file.mimetype !== "image/gif" &&
      file.mimetype !== "image/png"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Please upload a jpeg, gif or png file",
      });
    }

    var fileNameFinal =
      new Date().getTime().toString() + "-" + file.originalFilename;
    var oldPath = file._writeStream.path;
    var newPath = "./public/files" + "/" + fileNameFinal;
    var rawData = fs.readFileSync(oldPath);

    fs.writeFile(newPath, rawData, function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err,
        });
      }
    });
    const fullpath = `files/${fileNameFinal}`;

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
      });
    } catch (error) {
      return res.status(400).json({
        error,
      });
    }
    res.redirect("/film/" + film._id);
    //res.render("pages/about");
  });
};

// Get Film detail page
exports.filmDetail = function (req, res, next) {
  const promise = Film.find({ _id: req.params.id }).exec();

  promise.then(function (docs) {
    Category.find({ _id: docs[0].category.toString() }).exec(function (
      err,
      cats
    ) {
      if (err) {
        return next(err);
      }

      res.render("pages/film_detail", {
        film: docs[0],

        category: cats[0].name,
        image: "/" + docs[0].image,
      });
    });
  });
};

exports.filmEditForm = function (req, res, next) {
  const promise = Film.find({ _id: req.params.id }).exec();

  promise.then(function (docs) {
    Category.find().exec(function (err, cats) {
      if (err) {
        return next(err);
      }

      res.render("pages/filmFormEdit", {
        film: docs[0],
        categories: cats,

        image: "/" + docs[0].image,
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
        status: "Fail",
        message: "There was an error parsing the files",
        error: err,
      });
    }
    const { name, director, price, availability, category, film_id } = fields;
    if (fieldValidator(fields)) {
      return res.status(400).json(fieldValidator(fields));
    }
    // check if file is null
    const file = await files.myFile;

    if (file.size !== 0) {
      if (
        file.mimetype !== "image/jpeg" &&
        file.mimetype !== "image/gif" &&
        file.mimetype !== "image/png"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Please upload a jpeg, gif or png file",
        });
      }

      var fileNameFinal =
        new Date().getTime().toString() + "-" + file.originalFilename;
      var oldPath = file._writeStream.path;
      var newPath = "./public/files" + "/" + fileNameFinal;
      var rawData = fs.readFileSync(oldPath);

      fs.writeFile(newPath, rawData, function (err) {
        if (err) {
          return res.status(400).json({
            success: false,
            error: err,
          });
        }
      });
      fullpath = `files/${fileNameFinal}`;
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
      // _id: mongoose.Types.ObjectId(film_id),
      _id: film_id,
    };

    Film.findOneAndUpdate(filter, update, null, function (err, result) {
      if (err) {
        return err;
      }
    });
    res.redirect("/film/" + film_id);
  });
};

exports.delete_film = function (req, res, next) {
  const del_film_promise = Film.findByIdAndRemove(req.params.id).exec();

  del_film_promise.then(function (err) {
    if (err) {
      return next(err);
    }
  });
  res.redirect("/films");
};

exports.filmCategory = function (req, res, next) {
  Film.find({ category: [new ObjectId(req.params.id)] }).exec(function (
    err,
    cat_films
  ) {
    if (err) {
      return next(err);
    }

    res.render("pages/catfilm", {
      cat_films: cat_films,
    });
  });
};

// GET request for list of all film items.

exports.searchFilms = function (req, res, next) {
  Film.find({ name: { $regex: req.body.term, $options: "i" } }).exec(function (
    err,
    result
  ) {
    if (err) {
      return next(err);
    }

    res.render("pages/film_list", {
      film_list: result,
    });
  });
};

exports.film_list = function (req, res, next) {
  Film.find({}, "name director availability")
    .sort({ name: 1 })
    .exec(function (err, list_films) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("pages/film_list", {
        film_list: list_films,
      });
    });
};
