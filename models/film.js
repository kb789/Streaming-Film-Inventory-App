const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var FilmSchema = new Schema({
  name: { type: String, required: true },
  director: { type: String, required: true },
  price: { type: Number, required: true },
  availability: { type: String, required: true },
  category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  image: { type: String },
});

// Virtual for book's URL
FilmSchema.virtual("url").get(function () {
  return "/film/" + this._id;
});

//Export model
module.exports = mongoose.model("Film", FilmSchema);
