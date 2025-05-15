const express = require("express");
const router = express.Router();
const request = require("request");
const auth = require("../../middlewares/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { check, validationResult } = require("express-validator");
const { profile_url } = require("gravatar");
const config = require("config");

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) {
      return res.status(400).json({ msg: "There is no Profile for this user" });
    }

    res.json(profile);
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Server Error!");
  }
});

// @route   POST /api/profile
// @desc    Create or update user profile
// @access  Private
router.post(
  "/",
  [
    auth,
    check("status", "Status is required.").not().isEmpty(),
    check("skills", "Skills are required.").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (twitter) profileFields.social.twitter = twitter;
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      // Create
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error.");
    }
  }
);

// @route   GET /api/profile
// @desc    Get all the details of profile
// @access  Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error.");
  }
});
// @route   GET /api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: "There is no Profile for this user!" });
    }

    res.json(profile);
  } catch (error) {
    console.error(error.message);

    // Handle invalid ObjectId error
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Profile not found" });
    }

    res.status(500).send("Server Error.");
  }
});

// @route   DELETE /api/profile
// @desc    Delete a profile
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    // Remove Profile
    await Profile.findOneAndDelete({ user: req.user.id });

    // Remove User
    await User.findByIdAndDelete(req.user.id);

    res.json({ msg: "User deleted successfully." });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error.");
  }
});

// @route   PUT /api/profile/experience
// @desc    Add experience to a Profile
// @access  Private

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required.").not().isEmpty(),
      check("company", "company is required.").not().isEmpty(),
      check("from", "from is required.").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, description, from, to, current } =
      req.body;

    const newExp = {
      title,
      company,
      location,
      description,
      from,
      to,
      current,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Sever Error");
    }
  }
);

// @route   DELETE /api/profile/experience/:edu_id
// @desc    Delete an experience from profile
// @access  Private
router.delete("/experience/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Check if profile exists
    if (!profile) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    // Get index of experience to remove
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    // Check if experience exists
    if (removeIndex === -1) {
      return res.status(404).json({ msg: "Experience not found" });
    }

    // Remove experience
    profile.experience.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error.");
  }
});

// @route   PUT /api/profile/education
// @desc    Add education to a Profile
// @access  Private

router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required.").not().isEmpty(),
      check("degree", "degree is required.").not().isEmpty(),
      check("fieldofstudy", "Fieldofstudy is required"),
      check("from", "from is required.").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldofstudy, description, from, to, current } =
      req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      description,
      from,
      to,
      current,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEducation);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Sever Error");
    }
  }
);
// @route   DELETE /api/profile/education/:edu_id
// @desc    Delete an education from profile
// @access  Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    if (removeIndex === -1) {
      return res.status(404).json({ msg: "Education not found" });
    }

    profile.education.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error.");
  }
});

// @route   GET /api/profile/github/:username
// @desc    Get Users repo from GitHub
// @access  Public

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort:created:asc&client_id=${config.get(
        "githubClientID"
      )}&client_secret=${config.get("githubSecretID")}`,
      method: "GET",
      Headers: { "user-agent": "node.js " },
    };

    request(options, (error, response, body) => {
      if (error) {
        console.log(error.message);
      }
      if (response.statusCode !== 200) {
        return res.status(404).send({ msg: "No Github Profile Found!" });
      }
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error!");
  }
});

module.exports = router;
