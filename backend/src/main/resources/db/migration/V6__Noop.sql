-- No-op migration to fill version gap (V6) in the main migration sequence.
-- A previous local-only migration used version 6. Keeping main migrations gap-free
-- avoids Flyway validation failures when higher versions (V7+) exist.


