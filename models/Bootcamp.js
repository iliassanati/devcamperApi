const mongoose = require("mongoose");
const slugify = require("slugify");
const geocoder = require("../utils/geocoder");

const BootcampSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'name cannot be more than 50 caracters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'please add a description'],
    maxlength: [500, 'Description cannot be more than 500 caracters'],
  },
  website: {
    type: String,
    match: [/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, 'please add a valid URL with HTTP or HTTPS'],
  },
  phone: {
    type: String,
    maxlength: [20, 'phone cannot be more than 20 caracters'],
  },
  email: {
    type: String,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'please add a valid email'],
  },
  address: {
    type: String,
    required: [true, 'please add an address'],
  },
  location: {
    //GETJSON Point 
    type: {
      type: String,
      enum: ['Point'],

    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    country: String,
  },
  carrees: {
    //array of string
    type: [String],
    required: true,
    enum: [
      'Web Development',
      'Mobile Devlopment',
      'UI/UX',
      'Data Sciences',
      'Business',
      'Other'
    ]
  },
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [10, 'Rating cannot be more than 10'],
  },
  averageCost: Number,
  photo: {
    type: String,
    default: 'no-photo.jpg'
  },
  housing: {
    type: Boolean,
    default: false
  },
  jobAssistance: {
    type: Boolean,
    default: false
  },
  jobGuarantee: {
    type: Boolean,
    default: false
  },
  acceptGi: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

//create bootcamp slug from the name
BootcampSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Gecode & create location field
BootcampSchema.pre("save", async function (next) {
  const loc = await geocoder.geocode(this.address);

  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].state,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode,
  };

  //do not save address in DB
  this.address = undefined;
  next();

})

//Cascade delete courses when a boorcamp is deleted
BootcampSchema.pre('remove', async function (next) {

  await this.model('Course').deleteMany({ bootcamp: this._id });
  next();
})

//reverse populate with virtuals
BootcampSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'bootcamp',
  justOne: false
});

module.exports = mongoose.model('Bootcamp', BootcampSchema);