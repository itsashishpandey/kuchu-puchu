-- Kids taxonomy (ages 3–8): rename channels' display category from the old kids names to the new category names.
UPDATE "Channel" SET "category" = 'Rhymes & Songs' WHERE "category" = 'Nursery Rhymes';
UPDATE "Channel" SET "category" = 'Rhymes & Songs' WHERE "category" = 'Kids Songs';
UPDATE "Channel" SET "category" = 'Stories & Fairy Tales' WHERE "category" = 'Story Time';
UPDATE "Channel" SET "category" = 'Early Learning' WHERE "category" = 'Learning & Fun';
UPDATE "Channel" SET "category" = 'Animals' WHERE "category" = 'Animals & Friends';
UPDATE "Channel" SET "category" = 'Dance & Movement' WHERE "category" = 'Dance & Fun';
UPDATE "Channel" SET "category" = 'Our World' WHERE "category" = 'Family Adventures';
UPDATE "Channel" SET "category" = 'Science & Nature' WHERE "category" = 'Science for Kids';
UPDATE "Channel" SET "category" = 'Cartoons & Animation' WHERE "category" = 'Kids & Cartoons';
