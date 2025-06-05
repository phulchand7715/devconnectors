const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middlewares/auth");
const User = require("../../models/User");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");

// @route      POST api/posts
// @desc       Create a Post
// @access     Private
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route      GET api/posts
// @desc       Get all Post
// @access     Private

router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @route      GET api/posts/:id
// @desc       Get a Post  by id
// @access     Private

router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById();
    if (!post) {
      return res.status(400).json({ msg: "no post" });
    }
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectID") {
      return res.status(400).json({ msg: "no post" });
    }
    res.status(500).send("Server Error");
  }
});

// @route      DELETE api/posts/:id
// @desc       Dekete a Post  by id
// @access     Private

router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if the post belongs to the logged-in user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Unauthorized user" });
    }

    await post.deleteOne();
    res.json({ msg: "Post deleted successfully" });
  } catch (error) {
    console.error(error.message);

    // Invalid ObjectId format
    if (error.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid post ID" });
    }

    res.status(500).send("Server Error");
  }
});

// @route      PUT api/posts/like/:id
// @desc       Like a Post
// @access     Private

router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    if (post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).send("You have already liked the post!");
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error!");
  }
});

// @route      PUT api/posts/unlike/:id
// @desc       Like a Post
// @access     Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if user hasn't liked the post
    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).send("You have not liked the Post!");
    }

    // Get the index to remove
    const removeIndex = post.likes.findIndex(
      (like) => like.user.toString() === req.user.id
    );

    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error!");
  }
});

// @route      POST api/posts/comments/:id
// @desc       Comment on a Post
// @access     Private
router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();
      res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route      DELETE api/posts/comments/:id/:comment_id
// @desc       DeleteComment
// @access     Private

router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.id
    );

    //Make sure comment exist
    if (!comment) {
      return res.status(400).json({ msg: "Comment does not exist" });
    }

    //check user who is deleting?
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not allowd!" });
    }

    const removeIndex = post.comments
      .map((comment) => comment.use.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
