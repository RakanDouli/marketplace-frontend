export const CREATE_REVIEW_MUTATION = `
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id
      reviewerId
      reviewerName
      reviewerAvatar
      reviewedUserId
      listingId
      threadId
      rating
      positiveTags
      negativeTags
      createdAt
    }
  }
`;

export const USER_REVIEWS_QUERY = `
  query UserReviews($userId: ID!) {
    userReviews(userId: $userId) {
      id
      reviewerId
      reviewerName
      reviewerAvatar
      reviewedUserId
      listingId
      threadId
      rating
      positiveTags
      negativeTags
      createdAt
    }
  }
`;

export const CAN_REVIEW_USER_QUERY = `
  query CanReviewUser($reviewedUserId: ID!) {
    canReviewUser(reviewedUserId: $reviewedUserId)
  }
`;
