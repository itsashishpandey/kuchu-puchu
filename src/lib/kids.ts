// Kuchu Puchu is a kids-only platform (ages 3–8). These rules keep it suitable for the
// Google Play Families programme and the App Store Kids category.
import { KIDS_AUDIENCE } from "../../prisma/discovery-data.mjs";

export { KIDS_AUDIENCE };

/** Comments are off everywhere: kids can't post, and old comments are never shown publicly. */
export const COMMENTS_ENABLED = false;
export const COMMENTS_OFF_MESSAGE = "Comments are turned off to keep kids safe.";

/** Viewer accounts are for parents and guardians only — kids watch without an account. */
export const PARENT_CONFIRM_TEXT = "I am a parent or guardian aged 18 or over. Kids watch without an account.";

/** Every upload must carry this declaration. */
export const KIDS_SAFE_DECLARATION =
  `This video is made for children aged ${KIDS_AUDIENCE.minAge}–${KIDS_AUDIENCE.maxAge}: no violence, scary or adult content, bad language, ads, product promotion or links to outside sites.`;

export const AUDIENCE_INFO = {
  ...KIDS_AUDIENCE,
  commentsEnabled: COMMENTS_ENABLED,
  ads: false,
  parentConfirmText: PARENT_CONFIRM_TEXT,
  kidsSafeDeclaration: KIDS_SAFE_DECLARATION,
};
