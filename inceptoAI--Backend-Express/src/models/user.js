import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  results: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "result",
    },
  ],
});

userSchema.plugin(passportLocalMongoose, { usernameField: "email" });

export default mongoose.model("user", userSchema);
