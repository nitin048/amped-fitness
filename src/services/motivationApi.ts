export interface MotivationQuote {
  quote: string;
  author: string;
}

const GYM_MOTIVATION_BANK: MotivationQuote[] = [
  {
    quote: 'The last three or four reps is what makes the muscle grow. This area of pain divides a champion from someone who is not a champion.',
    author: 'Arnold Schwarzenegger',
  },
  {
    quote: "Ain't nothing to it but to do it. Lightweight, baby!",
    author: 'Ronnie Coleman',
  },
  {
    quote: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
  },
  {
    quote: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
    author: 'Muhammad Ali',
  },
  {
    quote: 'Do not pray for an easy life, pray for the strength to endure a difficult one.',
    author: 'Bruce Lee',
  },
  {
    quote: "The only person you're competing with is the person you were yesterday.",
    author: 'Dorian Yates',
  },
  {
    quote: "When you think that you are done, you're only 40% into what your body's capable of doing.",
    author: 'David Goggins',
  },
];

export const fetchDailyMotivation = async (): Promise<MotivationQuote> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://dummyjson.com/quotes/random', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.quote && data.author) {
        return {
          quote: data.quote,
          author: data.author,
        };
      }
    }
  } catch {
    // Offline or timeout fallback
  }

  // Fallback to gym legends
  const index = Math.floor(Math.random() * GYM_MOTIVATION_BANK.length);
  return GYM_MOTIVATION_BANK[index];
};

