import asyncio
import os
import sys
import tempfile
import sqlite3
import json
import secrets

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from enrich_anime import (
    AniSoraIdGenerator,
    RatePacer,
    ReorderBufferWriter,
    CheckpointDB,
    normalize_title,
    extract_hianime_id_from_response
)

async def test_anisora_id_generator():
    print("Testing AniSoraIdGenerator...")
    with tempfile.NamedTemporaryFile(suffix=".sql", delete=False) as tf:
        sql_path = tf.name
    try:
        db = CheckpointDB(sql_path)
        gen = AniSoraIdGenerator(db, 100000000, 999999999)

        # 1. Reject invalid range
        id1 = await gen.get_or_create_id(1, existing_id=99)  # < 100000000
        assert id1 >= 100000000, f"Failed range check: {id1}"

        # 2. Accept valid in-range ID
        id2 = await gen.get_or_create_id(2, existing_id=123456789)
        assert id2 == 123456789, f"Failed to preserve valid existing ID: {id2}"

        # 3. Reject duplicate of already used ID
        id3 = await gen.get_or_create_id(3, existing_id=123456789)
        assert id3 != 123456789, f"Allowed duplicate existing ID: {id3}"

        print("✓ AniSoraIdGenerator passed!")
    finally:
        try:
            if os.path.exists(sql_path):
                os.remove(sql_path)
        except Exception:
            pass

async def test_rate_pacer():
    print("Testing RatePacer (50 req/s non-blocking)...")
    pacer = RatePacer(target_rps=50.0)
    assert pacer.target_rps == 50.0
    assert abs(pacer.interval - 0.02) < 1e-4

    import time
    t0 = time.monotonic()
    for _ in range(10):
        await pacer.pace()
    t1 = time.monotonic()
    # 10 iterations at 0.02s should take approx 0.18-0.22s
    print(f"  Paced 10 requests in {t1 - t0:.4f}s (target ~0.20s)")
    assert (t1 - t0) >= 0.15, "Pacer was too fast"
    print("✓ RatePacer passed!")

async def test_reorder_writer_graceful_stop():
    print("Testing ReorderBufferWriter graceful stop...")
    with tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False) as tf:
        out_path = tf.name
    try:
        writer = ReorderBufferWriter(
            output_file_path=out_path,
            start_line_index=2,
            metadata_line='{"meta": true}'
        )
        await writer.start()

        # Push items out of order
        await writer.push(3, '{"line": 3}')
        await writer.push(2, '{"line": 2}')
        await writer.push(4, '{"line": 4}')

        # Graceful stop
        await writer.stop()

        # Verify output contents in exact order
        with open(out_path, "r", encoding="utf-8") as f:
            lines = [json.loads(l.strip()) for l in f]

        assert len(lines) == 4
        assert lines[0] == {"meta": True}
        assert lines[1] == {"line": 2}
        assert lines[2] == {"line": 3}
        assert lines[3] == {"line": 4}

        print("✓ ReorderBufferWriter passed!")
    finally:
        try:
            if os.path.exists(out_path):
                os.remove(out_path)
        except Exception:
            pass

async def test_normalization():
    print("Testing normalize_title...")
    assert normalize_title('"Attack on Titan"') == "attack on titan"
    assert normalize_title("Bleach: Sennen Kessen-hen") == "bleach sennen kessen hen"
    assert normalize_title("「0」") == "0"
    print("✓ normalize_title passed!")

async def main():
    await test_anisora_id_generator()
    await test_rate_pacer()
    await test_reorder_writer_graceful_stop()
    await test_normalization()
    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())
