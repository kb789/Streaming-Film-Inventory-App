const formidable = require('formidable');
const Category = require('../models/category');

const { body, validationResult } = require('express-validator');

exports.createForm = function (req, res) {
  res.render('pages/form');
};

exports.category_create = function (req, res) {
  var category = new Category({
    name: req.body.name,
    description: req.body.description,
  });
  category.save(function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err,
      });
    }

    res.redirect('/category/' + category._id);
  });
};

// Get film detail  page
exports.categoryDetail = function (req, res) {
  Category.find({ _id: req.params.id })
    .sort('name')
    .exec(function (err, docs) {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err,
        });
      }

      res.render('pages/category_detail', {
        name: docs[0].name,
        desc: docs[0].description,
        id: docs[0]._id,
      });
    });
};

// GET request for list of all category items.

exports.category_list = function (req, res, next) {
  Category.find({}, 'name description')
    .sort({ name: 1 })
    .exec(function (err, list_categories) {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err,
        });
      }

      res.render('pages/category_list', {
        category_list: list_categories,
      });
    });
};
