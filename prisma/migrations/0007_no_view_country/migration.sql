-- Kids' platform: views no longer record the viewer's country (approximate location). Clear what was stored.
UPDATE "ViewEvent" SET "country" = NULL WHERE "country" IS NOT NULL;
