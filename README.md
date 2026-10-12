### Hi, I'm Nadimul.

I build data products end to end: the pipelines that make the data trustworthy, the models or rules that turn it into decisions, and the product surface people actually use. Based in New York. Open to Data Engineering, Product Engineering, and Data Product roles.

**Things I've built**

| Project | What it is | Stack |
| --- | --- | --- |
| [bestdecks](https://github.com/Nadimul96/bestdecks) | Self-hosted proposal-deck generator that refuses to ship any factual claim it can't tie to retained source evidence. Durable SQLite job queue, claim-level provenance gate, render-only PPTX pipeline. 484 unit tests. [Live](https://bestdecks.co). | TypeScript, Next.js, SQLite, Cloudflare, Gemini |
| [remi-intake-engine](https://github.com/Nadimul96/remi-intake-engine) | Document intake for real-estate investment data: provenance-anchored extraction, human review to "accepted truth", entity reconciliation, conflict detection. Ships a synthetic dataset with a 7-conflict evaluation rubric. | TypeScript, Postgres, Temporal, Fastify, Next.js |
| [kalshi-vol-edge](https://github.com/Nadimul96/kalshi-vol-edge) | Crypto bracket trading system for Kalshi with exchange-as-source-of-truth reconciliation, fee-aware edge math, and a backtester that refuses to run on synthetic data. Includes post-mortems from seven months of live trading. 90 tests. | Python, asyncio, SQLite |
| [slideshow-renderer](https://github.com/Nadimul96/slideshow-renderer) | Prompt-to-video pipeline: structured LLM output, validated, rendered to 9:16 MP4 with Remotion. | TypeScript, Remotion, OpenAI |

**How I work**

- Provenance over polish. If a number can't be traced to its source, it doesn't ship.
- Honest status. Every repo above says what's implemented, what's experimental, and what's planned.
- Tests that run without accounts. Pure logic is tested offline; integration is gated behind explicit flags.

[LinkedIn](https://www.linkedin.com/in/nadimul-haque/) · nadimul96@gmail.com
