export interface SampleArticle {
  title: string;
  url: string;
  content: string;
  excerpt: string;
  author: string;
  site_name: string;
  word_count: number;
}

export const SAMPLE_ARTICLES: SampleArticle[] = [
  {
    title: "The Future of Artificial Intelligence",
    url: "https://example.com/ai-future",
    content: `Artificial Intelligence is transforming every aspect of our lives. From healthcare to transportation, AI systems are becoming increasingly sophisticated and capable.

Machine learning, a subset of AI, enables computers to learn from data without being explicitly programmed. Deep learning, using neural networks with multiple layers, has led to breakthroughs in image recognition, natural language processing, and game playing.

The future of AI promises even more exciting developments. Researchers are working on artificial general intelligence (AGI) - systems that can match human-level intelligence across all domains. While this remains a distant goal, current AI systems are already superhuman at specific tasks.

Ethical considerations are paramount as AI becomes more powerful. We must ensure AI systems are fair, transparent, and aligned with human values. Privacy concerns, job displacement, and autonomous weapons are just some of the challenges we face.

Despite the challenges, AI offers tremendous potential to solve humanity's greatest problems - from climate change to disease. The key is developing AI responsibly and ensuring its benefits are shared broadly across society.`,
    excerpt: "Exploring the transformative impact of AI on society and the ethical challenges we face.",
    author: "Dr. Sarah Chen",
    site_name: "Tech Insights",
    word_count: 187,
  },
  {
    title: "Productivity Hacks for Remote Workers",
    url: "https://example.com/remote-productivity",
    content: `Working remotely offers flexibility but requires discipline. Here are proven strategies to maximize your productivity when working from home.

First, establish a dedicated workspace. Your brain associates locations with activities, so working from your couch signals relaxation, not focus. A dedicated desk, even in a corner, helps you mentally "go to work."

Second, maintain a consistent schedule. Wake up and start work at the same time each day. This routine signals to your body and mind that it's time to be productive.

Third, use the Pomodoro Technique. Work in focused 25-minute intervals with 5-minute breaks. This prevents burnout and maintains high concentration levels throughout the day.

Fourth, minimize distractions. Turn off notifications, use website blockers during work hours, and communicate boundaries with family members.

Fifth, take real breaks. Step away from your desk, go for a walk, or do some stretching. Physical movement helps reset your mind and improves focus when you return.

Finally, end your workday deliberately. Create a shutdown ritual - review tomorrow's tasks, tidy your desk, and physically leave your workspace. This helps maintain work-life balance.`,
    excerpt: "Essential strategies for staying productive while working from home.",
    author: "James Rodriguez",
    site_name: "Remote Work Guide",
    word_count: 198,
  },
  {
    title: "Understanding Blockchain Technology",
    url: "https://example.com/blockchain-explained",
    content: `Blockchain is a revolutionary technology that powers cryptocurrencies like Bitcoin, but its applications extend far beyond digital money.

At its core, a blockchain is a distributed ledger - a database that is shared across a network of computers. Each "block" contains a batch of transactions, and these blocks are "chained" together chronologically.

What makes blockchain special is its decentralization. Instead of one company or government controlling the database, thousands of computers worldwide maintain identical copies. This makes the system extremely secure and resistant to tampering.

When someone tries to add a transaction to the blockchain, the network validates it through a consensus mechanism. For Bitcoin, this is called "proof of work" and involves solving complex mathematical puzzles. Once validated, the transaction is added to a new block.

Because each block contains a cryptographic hash of the previous block, changing historical data would require re-calculating all subsequent blocks - a practically impossible task given the computational power distributed across the network.

Beyond cryptocurrency, blockchain has applications in supply chain management, voting systems, digital identity, and smart contracts. Companies are exploring how this technology can increase transparency and reduce fraud in various industries.`,
    excerpt: "A beginner's guide to blockchain technology and its real-world applications.",
    author: "Michael Park",
    site_name: "Crypto Clarity",
    word_count: 205,
  },
  {
    title: "The Science of Learning: How Memory Works",
    url: "https://example.com/memory-science",
    content: `Understanding how memory works can dramatically improve your learning effectiveness. Our brains don't record information like a camera - they actively construct memories through complex processes.

Memory formation happens in three stages: encoding, storage, and retrieval. Encoding is when you first perceive information. Storage is how your brain maintains that information over time. Retrieval is accessing stored memories when needed.

The spacing effect shows that distributing learning over time is more effective than cramming. When you review material at increasing intervals, you strengthen neural pathways and improve long-term retention.

Active recall - testing yourself rather than re-reading - is one of the most powerful learning techniques. When you force your brain to retrieve information, you strengthen the memory trace much more than passive review.

Sleep plays a crucial role in memory consolidation. During sleep, your brain replays and strengthens the neural patterns formed during learning. This is why pulling all-nighters before exams is counterproductive.

Elaborative encoding - connecting new information to existing knowledge - creates richer, more retrievable memories. Ask yourself how new concepts relate to things you already know.

Finally, understanding beats memorization. When you truly comprehend something, you build a mental model that makes information easier to remember and apply in new contexts.`,
    excerpt: "Evidence-based strategies to enhance learning and memory retention.",
    author: "Dr. Lisa Wong",
    site_name: "Learning Science",
    word_count: 213,
  },
  {
    title: "Climate Change: What You Can Do",
    url: "https://example.com/climate-action",
    content: `Climate change is the defining challenge of our time, but individual actions matter more than you might think.

Transportation is a major source of emissions. Consider these changes: use public transit when possible, carpool, bike for short trips, or switch to an electric vehicle. Even reducing air travel by one or two flights per year makes a significant impact.

Diet choices matter. Reducing meat consumption, especially beef, can lower your carbon footprint substantially. You don't need to go fully vegetarian - even "Meatless Mondays" help. Choose local, seasonal produce when possible.

Energy use at home is another key area. Switch to LED bulbs, improve insulation, use a programmable thermostat, and consider renewable energy sources. Small efficiency improvements add up over time.

Reduce, reuse, recycle - in that order. The most sustainable product is the one you don't buy. Repair items instead of replacing them. Buy quality goods that last. When you do need something, consider buying used.

Vote and advocate for climate-conscious policies. Individual actions are important, but systemic change requires collective action. Support politicians and policies that prioritize environmental protection.

Educate yourself and others. Understanding climate science helps you make informed decisions and counter misinformation. Share what you learn with friends and family.`,
    excerpt: "Practical steps individuals can take to combat climate change.",
    author: "Emma Green",
    site_name: "Earth Action",
    word_count: 219,
  },
  {
    title: "Introduction to Quantum Computing",
    url: "https://example.com/quantum-computing-intro",
    content: `Quantum computing represents a fundamental shift in how we process information, leveraging the strange properties of quantum mechanics to solve problems impossible for classical computers.

Classical computers use bits that are either 0 or 1. Quantum computers use quantum bits or "qubits" that can exist in superposition - simultaneously 0 and 1 until measured. This allows quantum computers to explore many possibilities at once.

Another key principle is entanglement. When qubits become entangled, the state of one instantly influences the other, regardless of distance. This quantum correlation enables powerful computational capabilities.

Current quantum computers are still in early stages, operating in specialized laboratories at near absolute zero temperatures. They're extremely sensitive to environmental interference, a challenge called decoherence.

Despite limitations, quantum computers excel at specific problems. They could revolutionize drug discovery by simulating molecular interactions, break current encryption methods, optimize complex logistics, and accelerate artificial intelligence.

Major tech companies and governments are investing billions in quantum research. IBM, Google, and others offer cloud access to quantum computers for researchers and developers to experiment with.

The quantum revolution won't replace classical computers - instead, quantum and classical systems will work together, each handling tasks they're best suited for.`,
    excerpt: "Understanding the basics of quantum computing and its potential impact.",
    author: "Dr. Robert Kumar",
    site_name: "Quantum Explained",
    word_count: 207,
  },
  {
    title: "The Psychology of Habit Formation",
    url: "https://example.com/habit-psychology",
    content: `Habits shape our daily lives, often without conscious awareness. Understanding the psychology behind habits empowers us to build beneficial ones and break harmful patterns.

The habit loop consists of three components: cue, routine, and reward. A cue triggers the behavior, the routine is the behavior itself, and the reward reinforces it. Understanding this loop is key to behavior change.

To build a new habit, make it obvious, attractive, easy, and satisfying. Place cues in your environment (obvious), pair habits with activities you enjoy (attractive), reduce friction (easy), and create immediate rewards (satisfying).

Habit stacking leverages existing routines. After I [current habit], I will [new habit]. For example: "After I pour my morning coffee, I will meditate for one minute." This creates a natural cue.

Small habits compound over time. Don't aim for perfection - aim for consistency. A 1% improvement daily leads to 37x improvement over a year through compound growth.

Identity-based habits are most sustainable. Instead of "I want to run," think "I am a runner." This shifts from outcome-focused to identity-focused motivation.

Environment design is crucial. Make good habits obvious and easy, bad habits invisible and difficult. Want to read more? Place books on your nightstand. Want to eat healthier? Put fruits at eye level.`,
    excerpt: "How habits form and evidence-based strategies to change behavior.",
    author: "Dr. Marcus Johnson",
    site_name: "Behavioral Science",
    word_count: 227,
  },
  {
    title: "Cybersecurity Best Practices for Everyone",
    url: "https://example.com/cybersecurity-basics",
    content: `In our connected world, cybersecurity isn't just for IT professionals - everyone needs basic security hygiene to protect their digital life.

Password management is fundamental. Use unique, complex passwords for each account. A password manager like Bitwarden or 1Password handles this securely. Enable two-factor authentication (2FA) everywhere it's available.

Phishing attacks are increasingly sophisticated. Be skeptical of unexpected emails, especially those creating urgency or asking for sensitive information. Verify requests through a separate channel before responding.

Keep software updated. Updates often include critical security patches. Enable automatic updates for your operating system, browser, and applications.

Use a VPN on public WiFi. When connecting to networks at coffee shops or airports, a VPN encrypts your traffic, preventing eavesdropping on your activities.

Back up important data regularly. Follow the 3-2-1 rule: three copies of data, on two different media types, with one copy offsite. Cloud backup services make this easy.

Be cautious about permissions. Does that flashlight app really need access to your contacts? Review app permissions regularly and revoke unnecessary access.

Social media oversharing creates security risks. Information you post publicly can be used for social engineering attacks. Think before you share.`,
    excerpt: "Essential cybersecurity practices to protect your digital life.",
    author: "Alex Thompson",
    site_name: "Security First",
    word_count: 216,
  },
  {
    title: "Mindfulness and Mental Health",
    url: "https://example.com/mindfulness-mental-health",
    content: `Mindfulness - paying attention to the present moment without judgment - has moved from ancient Buddhist practice to mainstream mental health tool, backed by substantial research.

Regular mindfulness practice changes brain structure. Studies show increased gray matter in regions associated with learning, memory, and emotional regulation. The amygdala, our stress response center, becomes less reactive.

You don't need hours of meditation. Even 10 minutes daily provides benefits. Start small and build consistency. Morning is often easiest, before the day's demands take over.

Mindful breathing is the foundation. Notice the sensation of breath entering and leaving your body. When your mind wanders (and it will), gently return attention to breath without self-criticism.

Body scan meditation builds awareness of physical sensations. Mentally scan from head to toe, noticing tension, temperature, and comfort without trying to change anything.

Mindful eating transforms a routine activity into meditation. Notice colors, smells, textures, and tastes. Chew slowly. This improves digestion and reduces overeating.

For anxiety and depression, mindfulness helps break the cycle of rumination. By observing thoughts without getting caught in them, you create space between stimulus and response.

Loving-kindness meditation extends compassion to yourself and others. This practice counters our negativity bias and improves relationships.`,
    excerpt: "How mindfulness meditation improves mental health and well-being.",
    author: "Dr. Maya Patel",
    site_name: "Mind & Wellness",
    word_count: 223,
  },
  {
    title: "The Future of Work: Trends Shaping Tomorrow's Jobs",
    url: "https://example.com/future-of-work",
    content: `The workplace is transforming faster than ever. Understanding these trends helps you prepare for tomorrow's opportunities and challenges.

Remote work is here to stay. The pandemic proved many jobs can be done from anywhere. Companies are adopting hybrid models, reducing office space, and hiring globally. This creates opportunities but also increases competition.

Automation and AI will transform most jobs, not necessarily eliminate them. Rather than fearing replacement, focus on skills that complement technology: creativity, emotional intelligence, complex problem-solving, and adaptability.

The gig economy continues growing. More people work as freelancers, consultants, or on short-term contracts. This offers flexibility but requires self-discipline and financial planning.

Continuous learning becomes essential. The half-life of skills is shrinking. Plan to regularly update your knowledge and acquire new skills throughout your career.

Soft skills gain importance. As routine tasks automate, uniquely human capabilities matter more: communication, collaboration, critical thinking, and leadership.

Green jobs are expanding rapidly. Climate change drives demand for renewable energy, sustainable agriculture, and environmental science professionals.

Healthcare and eldercare sectors will boom as populations age. Roles combining technology with human touch will be particularly valuable.

Prepare by staying curious, building diverse skills, and maintaining a growth mindset.`,
    excerpt: "Key trends reshaping the future of work and how to prepare.",
    author: "Jennifer Wu",
    site_name: "Career Futures",
    word_count: 225,
  },
];