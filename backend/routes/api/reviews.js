const express = require("express");

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const { requireAuth } = require("../../utils/auth");

const { Spot } = require("../../db/models");
const { Review } = require("../../db/models");
const { User } = require("../../db/models");
const { ReviewImage } = require("../../db/models");

const router = express.Router();

const validateReviewCreation = [
  check("review")
    .exists({ checkFalsy: true })
    .notEmpty({ checkFalsy: true })
    .isLength({ min: 1, max: 250 })
    .withMessage("Review text is required"),
  check("stars")
    .exists({ checkFalsy: true })
    .notEmpty({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage("Stars must be an integer from 1 to 5"),
];

//get all reviews of the current user
router.get("/current", requireAuth, async (req, res) => {
  try {
    let reviews = await Review.findAll({
      where: {
        userId: req.user.id,
      },
    });
    if (reviews) {
      return res.status(200).json({
        Reviews: reviews,
      });
    } else if (!reviews) {
      return res.json({
        message: "No reviews found for this user",
      });
    }
  } catch (error) {
    return res.json({
      message: error,
    });
  }
});

//add an image to a review based on the review's id
router.post("/:reviewId/images", requireAuth, async (req, res) => {
  let review = await Review.findByPk(req.params.reviewId);

  if (!review) {
    return res.status(404).json({
      message: "Review couldn't be found",
    });
  }

  if (review.userId !== req.user.id) {
    return res.status(403).json({
      message: "You are not authorized to perform this action",
    });
  }

  let reviewImages = await ReviewImage.findAll({
    where: {
      reviewId: review.id,
    },
  });

  if (reviewImages.count >= 10) {
    return res.status(403).json({
      message: "Maximum number of images for this resource was reached",
    });
  }

  let newImage = await ReviewImage.create({
    reviewId: review.id,
    url: req.body.url,
  });

  let formatImage = {
    id: newImage.id,
    url: newImage.url,
  };

  return res.status(200).json({ ...formatImage });
});

//edit a review
router.put(
  "/:reviewId",
  validateReviewCreation,
  requireAuth,
  async (req, res) => {
    const { review, stars } = req.body;

    let errors = {};

    if (review.length <= 0) {
      errors.review = "Review text is required";
    }

    if (stars % 1 !== 0 || stars < 1 || stars > 5) {
      errors.stars = "Stars must be an integer from 1 to 5";
    }

    if (errors.review || errors.stars) {
      return res.status(400).json({
        message: "Bad Request",
        errors,
      });
    }

    let targetReview = await Review.findByPk(req.params.reviewId);

    if (!review) {
      return res.status(400).json({
        message: "Review couldn't be found",
      });
    }

    if (targetReview.userId !== req.user.id) {
      res.status(403).json({
        message: "You are not authorized to perform this action",
      });
    }

    if (review) targetReview.review = review;
    if (stars) targetReview.stars = stars;

    await targetReview.validate();

    return res.status(200).json({
      targetReview,
    });
  }
);

//delete a review
router.delete("/:reviewId", requireAuth, async (req, res) => {
  let review = await Review.findByPk(req.params.reviewId);

  if (review.userId !== req.user.id) {
    return res.status(403).json({
      message: "You are not authorized to perform this action",
    });
  }

  if (!review) {
    return res.status(404).json({
      message: "Review couldn't be found",
    });
  }

  await review.destroy();

  return res.status(200).json({
    message: "Successfully deleted",
  });
});

module.exports = router;