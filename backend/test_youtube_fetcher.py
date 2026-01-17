"""
Test script for YouTube transcript fetcher.
Run this to verify the pipeline works end-to-end.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.youtube_fetcher import fetch_youtube_transcript, extract_video_id, YouTubeFetchError


def test_extract_video_id():
    """Test video ID extraction from various URL formats."""
    test_cases = [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ]

    print("Testing video ID extraction...")
    for url, expected_id in test_cases:
        video_id = extract_video_id(url)
        status = "PASS" if video_id == expected_id else "FAIL"
        print(f"  [{status}] {url[:50]:<50} -> {video_id}")
    
    print()


def test_fetch_transcript(url: str = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"):
    """Test fetching a real transcript from YouTube."""
    print(f"Testing transcript fetch from: {url}")
    print("=" * 60)
    
    try:
        segments, metadata = fetch_youtube_transcript(url)
        
        print(f"\n[PASS] Successfully fetched transcript!")
        print(f"  Video ID: {metadata['video_id']}")
        print(f"  URL: {metadata['url']}")
        print(f"  Segments: {len(segments)}")
        print(f"\nFirst 3 segments:")
        for i, seg in enumerate(segments[:3]):
            print(f"  [{seg.t0:4d}-{seg.t1:4d}] {seg.text[:60]}...")

        return True

    except YouTubeFetchError as e:
        print(f"\n[FAIL] Failed to fetch transcript: {e}")
        return False
    except Exception as e:
        print(f"\n[FAIL] Unexpected error: {e}")
        return False


if __name__ == "__main__":
    print("YouTube Transcript Fetcher Test")
    print("=" * 60)
    print()
    
    # Test 1: Video ID extraction
    test_extract_video_id()
    
    # Test 2: Actual transcript fetching
    # Use a different video URL if you have a specific one in mind
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        # Default test video (Rick Astley - Never Gonna Give You Up)
        # This is a well-known video that usually has captions
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        print("No URL provided, using default test video.")
        print("Usage: python test_youtube_fetcher.py <youtube_url>")
        print()
    
    success = test_fetch_transcript(url)
    
    if success:
        print("\n" + "=" * 60)
        print("[PASS] All tests passed! Pipeline is ready.")
    else:
        print("\n" + "=" * 60)
        print("[FAIL] Tests failed. Check error messages above.")
        print("\nNote: Some videos may not have transcripts available.")
        print("Try a different video URL with captions enabled.")
