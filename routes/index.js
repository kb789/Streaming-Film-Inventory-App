const express = require("express");
const { body, validationResult } = require("express-validator");
const { fieldValidator } = require("../utils/index");
const formidable = require("formidable");
var Film = require("../models/film");

const router = express.Router();

var film_controller = require("../controllers/filmController");
var category_controller = require("../controllers/categoryController");

// GET inventory home page.
router.get("/", film_controller.index);

// Create GET route to create a category
router.get("/category/create", category_controller.createForm);

// Create POST route to create a category
router.post(
  "/category/create",
  body("name").exists(),
  body("description").exists(),
  category_controller.category_create,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    return next();
  }
);

// GET request for one CategoryInstance.
router.get("/category/:id", category_controller.categoryDetail);

// GET request for list of all Category items.
router.get("/categories", category_controller.category_list);

// Create GET route to create a film
router.get("/film/create", film_controller.createForm);

// Create POST route to create a film
router.post("/film/create", film_controller.create);

// GET request for one FilmInstance.
router.get("/film/:id", film_controller.filmDetail);

// GET request to edit one FilmInstance.
router.get("/film/:id/edit", film_controller.filmEditForm);

// POST request to edit one FilmInstance.
router.post("/film/:id/edit", film_controller.editForm);

// POST request to delete BookInstance.
router.post("/film/:id/delete", film_controller.delete_film);

// GET request to find film by genre.
router.get("/film/category/:id", film_controller.filmCategory);

// POST request to edit one FilmInstance.
router.post("/films/search/", film_controller.searchFilms);

// GET request for list of all film items.
router.get("/films", film_controller.film_list);

module.exports = router;
