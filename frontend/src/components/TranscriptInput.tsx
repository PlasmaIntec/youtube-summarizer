import { useState } from "react";
import type { TranscriptInput as TranscriptInputType } from "../types/graph";

interface TranscriptInputProps {
  onSubmit: (input: TranscriptInputType) => void;
  isLoading: boolean;
}

const EXAMPLE_SIMPLE = `{
  "transcript": [
    { "t0": 0, "t1": 15, "text": "Today we're going to explore a fascinating concept in machine learning." },
    { "t0": 15, "t1": 30, "text": "Neural networks are composed of layers of interconnected nodes." },
    { "t0": 30, "t1": 45, "text": "Each node applies a transformation to its inputs." },
    { "t0": 45, "t1": 60, "text": "The key insight is that these transformations can be learned from data." }
  ],
  "title": "Introduction to Neural Networks"
}`;

const EXAMPLE_COMPLEX = `{
  "transcript": [
    { "t0": 0, "t1": 20, "text": "Today I want to explain why most people completely misunderstand how compound interest actually works, and why this misunderstanding costs them hundreds of thousands of dollars over their lifetime." },
    { "t0": 20, "t1": 45, "text": "The standard explanation is that compound interest means you earn interest on your interest. That's technically true but it completely misses the point. The real insight is about time asymmetry." },
    { "t0": 45, "t1": 70, "text": "Here's what I mean. If you invest $10,000 at 7% annual return, after 10 years you have about $20,000. After 20 years, $40,000. But after 40 years, you have $150,000. The growth in the last 10 years equals all the growth in the first 30 years combined." },
    { "t0": 70, "t1": 95, "text": "This is the time asymmetry principle: the value of early contributions is exponentially higher than late contributions. A dollar invested at 25 is worth roughly 16 dollars invested at 65." },
    { "t0": 95, "t1": 120, "text": "But here's where it gets interesting. Most financial advice focuses on the rate of return. Should you invest in stocks or bonds? Active or passive funds? These debates are almost irrelevant compared to the timing question." },
    { "t0": 120, "t1": 150, "text": "Let me give you a concrete example. Person A invests $5,000 per year from age 25 to 35, then stops. Total invested: $50,000. Person B invests $5,000 per year from age 35 to 65. Total invested: $150,000. At age 65, Person A has more money. Let that sink in." },
    { "t0": 150, "t1": 180, "text": "Person A invested one-third the amount but ended up with more. This isn't magic, it's the mathematical reality of exponential growth. The early money had 40 years to compound. The late money had 30 years or less." },
    { "t0": 180, "t1": 210, "text": "Now, there's a critical caveat here. This only works if you actually leave the money alone. The moment you withdraw or interrupt compounding, you reset the exponential clock. This is why most people never experience true compound growth." },
    { "t0": 210, "t1": 240, "text": "The average American changes jobs every 4 years. Each time, there's a temptation to cash out the 401k. Even a single interruption in your 30s can cost you half your retirement wealth. Half. From one decision." },
    { "t0": 240, "t1": 270, "text": "This connects to a deeper principle I call the illusion of linear thinking. Our brains evolved to think linearly because most things in nature are linear. If you walk twice as far, it takes twice as long. If you eat twice as much, you gain twice the weight." },
    { "t0": 270, "t1": 300, "text": "But compound growth is exponential, not linear. And our brains simply cannot intuit exponential curves. When asked to estimate exponential growth, people consistently underestimate by factors of 10 or more." },
    { "t0": 300, "t1": 330, "text": "This is why the marshmallow test is so predictive of life outcomes. It's not really about willpower. It's about whether you can override your linear intuition and act on exponential logic. Can you sacrifice a small thing now for a much larger thing later?" },
    { "t0": 330, "t1": 360, "text": "Let me introduce another concept: the critical mass threshold. In compound growth, there's a point where your returns exceed your contributions. Before this point, you're pushing the boulder uphill. After it, the boulder rolls itself." },
    { "t0": 360, "t1": 390, "text": "For most people at 7% returns, this critical mass is roughly 15-20 times your annual contribution. If you invest $10,000 a year, once you hit $150,000 to $200,000, your investment returns exceed your new contributions." },
    { "t0": 390, "t1": 420, "text": "This is the psychological turning point. Before critical mass, investing feels like sacrifice. After critical mass, it feels like inevitability. Your money is finally working harder than you are." },
    { "t0": 420, "t1": 450, "text": "But here's the trap. Most people never reach critical mass because they optimize for the wrong variable. They focus on maximizing returns when they should focus on minimizing interruptions." },
    { "t0": 450, "t1": 480, "text": "A 10% return that gets interrupted every 5 years performs worse than a 6% return that compounds for 30 years straight. Consistency beats intensity in exponential systems. This is counterintuitive but mathematically certain." },
    { "t0": 480, "t1": 510, "text": "There's also the inflation factor most people ignore. If inflation averages 3%, your real return is your nominal return minus 3%. So that 7% return is really 4% in purchasing power terms. This makes the time asymmetry even more extreme." },
    { "t0": 510, "t1": 540, "text": "At 4% real returns, money doubles every 18 years instead of every 10. This means the last doubling - the one that matters most - might happen after you're dead if you start too late." },
    { "t0": 540, "t1": 570, "text": "So what's the practical takeaway? First, start immediately. Not next year, not when you get a raise, now. The cost of waiting even one year is permanent and larger than you think." },
    { "t0": 570, "t1": 600, "text": "Second, automate everything. Remove the human from the loop. Every decision point is an opportunity to interrupt compounding. The best investors are the ones who forget they have investments." },
    { "t0": 600, "t1": 630, "text": "Third, treat your investment accounts as genuinely untouchable. Not 'untouchable except for emergencies.' Untouchable, period. Build a separate emergency fund so you're never tempted to raid your compound machine." },
    { "t0": 630, "t1": 660, "text": "Fourth, ignore the noise. Market crashes, hot stock tips, new investment products - none of it matters compared to uninterrupted time. The best investment strategy is one you'll actually stick to for 40 years." },
    { "t0": 660, "t1": 690, "text": "Finally, understand that this isn't about being rich. It's about buying future freedom. Every dollar you compound is a dollar of future optionality - the ability to say no to things you don't want to do." },
    { "t0": 690, "t1": 720, "text": "The tragedy isn't people who can't afford to invest. It's people who could invest but choose not to because they don't understand the exponential math. They trade 40 years of freedom for 40 years of slightly more consumption." }
  ],
  "title": "The Mathematics of Compound Interest Most People Never Learn",
  "description": "A deep dive into why timing matters more than returns, and the psychological barriers that prevent most people from achieving compound growth.",
  "channel": "Financial Foundations"
}`;

export function TranscriptInput({ onSubmit, isLoading }: TranscriptInputProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);

    try {
      const parsed = JSON.parse(input);

      if (!parsed.transcript || !Array.isArray(parsed.transcript)) {
        throw new Error('Input must contain a "transcript" array');
      }

      for (const seg of parsed.transcript) {
        if (
          typeof seg.t0 !== "number" ||
          typeof seg.t1 !== "number" ||
          typeof seg.text !== "string"
        ) {
          throw new Error(
            "Each transcript segment must have t0, t1 (numbers) and text (string)"
          );
        }
      }

      onSubmit(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const loadSimple = () => {
    setInput(EXAMPLE_SIMPLE);
    setError(null);
  };

  const loadComplex = () => {
    setInput(EXAMPLE_COMPLEX);
    setError(null);
  };

  return (
    <div className="transcript-input">
      <div className="input-header">
        <h2>Transcript Input</h2>
        <div className="example-buttons">
          <button className="example-btn" onClick={loadSimple}>
            Simple (1 min)
          </button>
          <button className="example-btn complex" onClick={loadComplex}>
            Complex (12 min)
          </button>
        </div>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`Paste your transcript JSON here...

Format:
{
  "transcript": [
    { "t0": 0, "t1": 30, "text": "..." }
  ],
  "title": "Optional title"
}`}
        disabled={isLoading}
      />

      {error && <div className="error-message">{error}</div>}

      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? "Compiling..." : "Compile Graph"}
      </button>

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner" />
          <p>Processing transcript with Claude...</p>
        </div>
      )}
    </div>
  );
}
