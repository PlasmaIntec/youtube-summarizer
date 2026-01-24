"""
YouTube Transcript Fetcher.
Fetches transcripts from YouTube URLs using yt-dlp.
"""
import os
import re
import subprocess
import sys
import tempfile
from typing import Optional
from urllib.parse import urlparse, parse_qs

from app.models.transcript import TranscriptSegment


class YouTubeFetchError(Exception):
    """Custom exception for YouTube fetching errors."""
    pass


def extract_video_id(url: str) -> str:
    """
    Extract YouTube video ID from various URL formats.

    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/v/VIDEO_ID
    """
    # Pattern 1: youtu.be short URLs
    if "youtu.be/" in url:
        video_id = url.split("youtu.be/")[-1].split("?")[0].split("&")[0]
        return video_id

    # Pattern 2: Standard youtube.com URLs
    parsed = urlparse(url)

    if parsed.hostname in ("www.youtube.com", "youtube.com", "m.youtube.com"):
        if parsed.path == "/watch":
            query_params = parse_qs(parsed.query)
            if "v" in query_params:
                return query_params["v"][0]
        elif parsed.path.startswith("/embed/"):
            return parsed.path.split("/embed/")[-1].split("?")[0]
        elif parsed.path.startswith("/v/"):
            return parsed.path.split("/v/")[-1].split("?")[0]

    # Try to extract as raw video ID (11 characters, alphanumeric + - and _)
    video_id_pattern = r"[a-zA-Z0-9_-]{11}"
    match = re.search(video_id_pattern, url)
    if match:
        return match.group(0)

    raise YouTubeFetchError(
        f"Could not extract video ID from URL: {url}. "
        "Please provide a valid YouTube URL."
    )


def parse_vtt_to_segments(vtt_content: str) -> list[TranscriptSegment]:
    """Parse VTT subtitle content into TranscriptSegment list."""
    import html
    raw_segments = []

    # VTT timestamp pattern: 00:00:00.000 --> 00:00:00.000
    timestamp_pattern = r"(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})"

    lines = vtt_content.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        match = re.match(timestamp_pattern, line)
        if match:
            # Parse start time (ignore milliseconds)
            h1, m1, s1 = int(match.group(1)), int(match.group(2)), int(match.group(3))
            t0 = h1 * 3600 + m1 * 60 + s1

            # Parse end time (ignore milliseconds)
            h2, m2, s2 = int(match.group(5)), int(match.group(6)), int(match.group(7))
            t1 = h2 * 3600 + m2 * 60 + s2

            # Collect text lines until empty line or next timestamp
            i += 1
            text_lines = []
            while i < len(lines) and lines[i].strip() and not re.match(timestamp_pattern, lines[i]):
                text = lines[i].strip()
                # Remove VTT formatting tags like <c> </c>
                text = re.sub(r'<[^>]+>', '', text)
                if text:
                    text_lines.append(text)
                i += 1

            if text_lines:
                # Decode HTML entities like &gt; -> >
                full_text = html.unescape(' '.join(text_lines))
                raw_segments.append(TranscriptSegment(
                    t0=t0,
                    t1=t1,
                    text=full_text
                ))
        else:
            i += 1

    # YouTube auto-captions have rolling/progressive text where each segment
    # includes text from the previous segment. We need to extract only the NEW text.
    if not raw_segments:
        return []

    # Extract only new text from each segment by removing overlap with previous
    cleaned_parts = []
    prev_text = ""

    for seg in raw_segments:
        curr_text = seg.text
        new_text = curr_text

        # Find overlap: check if end of prev_text matches start of curr_text
        if prev_text:
            # Try to find the longest overlap
            for overlap_len in range(min(len(prev_text), len(curr_text)), 0, -1):
                if prev_text[-overlap_len:] == curr_text[:overlap_len]:
                    new_text = curr_text[overlap_len:].strip()
                    break

        if new_text:
            cleaned_parts.append((seg.t0, seg.t1, new_text))
        prev_text = curr_text

    if not cleaned_parts:
        return []

    # Merge into paragraphs (~30 seconds each)
    paragraphs = []
    current_t0 = cleaned_parts[0][0]
    current_t1 = cleaned_parts[0][1]
    current_words = [cleaned_parts[0][2]]

    for t0, t1, text in cleaned_parts[1:]:
        # Start new paragraph every ~30 seconds
        if t0 - current_t0 >= 30:
            paragraphs.append(TranscriptSegment(
                t0=current_t0,
                t1=current_t1,
                text=' '.join(current_words)
            ))
            current_t0 = t0
            current_words = []

        current_words.append(text)
        current_t1 = t1

    # Don't forget the last paragraph
    if current_words:
        paragraphs.append(TranscriptSegment(
            t0=current_t0,
            t1=current_t1,
            text=' '.join(current_words)
        ))

    return paragraphs


def fetch_youtube_transcript(
    url: str,
    languages: Optional[list[str]] = None
) -> tuple[list[TranscriptSegment], dict]:
    """
    Fetch transcript from YouTube URL using yt-dlp.

    Args:
        url: YouTube video URL
        languages: Preferred languages (default: ['en'])

    Returns:
        Tuple of (transcript_segments, metadata)
        metadata includes: video_id, url

    Raises:
        YouTubeFetchError: If transcript cannot be fetched
    """
    if languages is None:
        languages = ["en"]

    try:
        video_id = extract_video_id(url)
    except YouTubeFetchError as e:
        raise e

    # Create temp directory for subtitle files
    with tempfile.TemporaryDirectory() as temp_dir:
        output_template = os.path.join(temp_dir, "sub")

        # Build yt-dlp command (use sys.executable to ensure same Python)
        cmd = [
            sys.executable, "-m", "yt_dlp",
            "--write-auto-sub",
            "--sub-lang", ",".join(languages),
            "--skip-download",
            "-o", output_template,
            f"https://www.youtube.com/watch?v={video_id}"
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
        except subprocess.TimeoutExpired:
            raise YouTubeFetchError("Timeout while fetching transcript")
        except FileNotFoundError:
            raise YouTubeFetchError("yt-dlp not found. Install with: pip install yt-dlp")

        # Find the subtitle file
        vtt_file = None
        for lang in languages:
            potential_file = os.path.join(temp_dir, f"sub.{lang}.vtt")
            if os.path.exists(potential_file):
                vtt_file = potential_file
                break

        # Also check for any .vtt file
        if not vtt_file:
            for f in os.listdir(temp_dir):
                if f.endswith('.vtt'):
                    vtt_file = os.path.join(temp_dir, f)
                    break

        if not vtt_file:
            # Check stderr for common errors
            if "Video unavailable" in result.stderr:
                raise YouTubeFetchError(f"Video is unavailable: {video_id}")
            if "subtitles" in result.stderr.lower() and "not available" in result.stderr.lower():
                raise YouTubeFetchError(f"No transcript found for video: {video_id}")
            raise YouTubeFetchError(
                f"Could not fetch transcript for video: {video_id}. "
                f"yt-dlp output: {result.stderr[:200] if result.stderr else 'none'}"
            )

        # Read and parse the VTT file
        with open(vtt_file, 'r', encoding='utf-8') as f:
            vtt_content = f.read()

        segments = parse_vtt_to_segments(vtt_content)

        if not segments:
            raise YouTubeFetchError(f"No transcript content found for video: {video_id}")

        metadata = {
            "video_id": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
        }

        return segments, metadata
