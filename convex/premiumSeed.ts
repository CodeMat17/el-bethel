import { FACILITIES } from "../lib/school/config";
import { internalMutation } from "./_generated/server";

/**
 * Demo content for the premium modules (development only). Safe to run on a
 * database that already has data: each part is skipped if its table has rows.
 *
 *   npx convex run premiumSeed:run
 *
 * `seed:demo` runs it too.
 */

const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000).toISOString();

const PRODUCTS = [
  { name: "Day uniform — shirt", category: "uniform", price: 6500, sizes: ["Age 4", "Age 6", "Age 8", "Age 10", "Age 12"], description: "Short-sleeved white shirt with the school crest." },
  { name: "Day uniform — shorts or skirt", category: "uniform", price: 7000, sizes: ["Age 4", "Age 6", "Age 8", "Age 10", "Age 12"], description: "Navy, with an adjustable waist. Choose shorts or skirt at collection." },
  { name: "School cardigan", category: "uniform", price: 9500, sizes: ["Age 6", "Age 8", "Age 10", "Age 12"], description: "Navy knit cardigan with gold trim, for the harmattan mornings." },
  { name: "House T-shirt", category: "sportswear", price: 5000, sizes: ["Small", "Medium", "Large"], description: "Breathable sports T-shirt in your child's house colour (Emerald, Sapphire, Ruby or Amber)." },
  { name: "PE shorts", category: "sportswear", price: 4000, sizes: ["Small", "Medium", "Large"], description: "Navy PE shorts for games and inter-house sports." },
  { name: "Reading passport", category: "books", price: 1500, sizes: ["One size"], description: "The termly reading-challenge passport. Collect a stamp for every book." },
  { name: "Mathematics workbook — Primary 4", category: "books", price: 4500, sizes: ["One size"], description: "Practice book that follows the Primary 4 scheme of work." },
  { name: "Stationery pack", category: "stationery", price: 3500, sizes: ["One size"], description: "Pencils, eraser, sharpener, ruler, colouring pencils and a mathematical set." },
  { name: "School bag", category: "accessories", price: 12000, sizes: ["Junior", "Senior"], description: "Padded backpack with reflective strips and a name tag." },
  { name: "Water bottle", category: "accessories", price: 2500, sizes: ["One size"], description: "500 ml leak-proof bottle in school navy." },
] as const;

const RESOURCES = [
  { title: "The Tale of Peter Rabbit", author: "Beatrix Potter", kind: "ebook", category: "Classic stories", levels: ["lvl-p1", "lvl-p2", "lvl-p3"], url: "https://www.gutenberg.org/ebooks/14838", minutes: 15, description: "A mischievous rabbit, Mr McGregor's garden, and a narrow escape. Illustrated." },
  { title: "Just So Stories", author: "Rudyard Kipling", kind: "ebook", category: "Classic stories", levels: ["lvl-p3", "lvl-p4", "lvl-p5"], url: "https://www.gutenberg.org/ebooks/2781", minutes: 20, description: "How the leopard got his spots, how the camel got his hump, and other tales." },
  { title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", kind: "ebook", category: "Classic stories", levels: ["lvl-p5", "lvl-p6", "lvl-j1"], url: "https://www.gutenberg.org/ebooks/11", minutes: 30, description: "Down the rabbit hole with Alice, the Cheshire Cat and the Queen of Hearts." },
  { title: "The Jungle Book", author: "Rudyard Kipling", kind: "ebook", category: "Adventure", levels: ["lvl-p6", "lvl-j1", "lvl-j2"], url: "https://www.gutenberg.org/ebooks/236", minutes: 30, description: "Mowgli, raised by wolves, learns the law of the jungle." },
  { title: "African Storybook library", author: "African Storybook", kind: "ebook", category: "African stories", levels: [], url: "https://www.africanstorybook.org/", minutes: 10, description: "Hundreds of free picture stories from across Africa, in English and many African languages." },
  { title: "StoryWeaver read-alongs", author: "Pratham Books", kind: "ebook", category: "Picture books", levels: ["lvl-n2", "lvl-n3", "lvl-p1", "lvl-p2"], url: "https://storyweaver.org.in/", minutes: 10, description: "Open-licence picture books with read-along audio for early readers." },
] as const;

const SCENES_INTRO = {
  slug: "welcome",
  title: "Welcome to El-Bethel",
  area: "Main gate",
  narration:
    "Welcome! This short walk takes you through the spaces where our pupils learn, play and grow. Use the arrows or swipe to move between rooms, and book a visit when you'd like to see it in person.",
  highlights: ["Gated, staffed entrance", "Visitor sign-in", "Drop-off lane"],
  photoSeed: "hero-d",
};

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const done: string[] = [];
    const at = new Date().toISOString();

    if (!(await ctx.db.query("tourScenes").first())) {
      await ctx.db.insert("tourScenes", { ...SCENES_INTRO, order: 1, published: true, updatedAt: at });
      for (const [i, f] of FACILITIES.entries()) {
        await ctx.db.insert("tourScenes", { slug: f.slug, title: f.name, area: "Facilities", narration: f.description, highlights: f.highlights, photoSeed: f.slug, order: i + 2, published: true, updatedAt: at });
      }
      done.push("tour");
    }

    if (!(await ctx.db.query("products").first())) {
      for (const [i, p] of PRODUCTS.entries()) {
        await ctx.db.insert("products", {
          slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          name: p.name,
          category: p.category,
          description: p.description,
          price: p.price,
          variants: p.sizes.map((size, j) => ({ size, stock: (i * 7 + j * 5) % 3 === 0 ? 2 : 12 + j })),
          active: true,
          updatedAt: at,
        });
      }
      done.push("shop");
    }

    if (!(await ctx.db.query("digitalResources").first())) {
      for (const [i, r] of RESOURCES.entries()) {
        await ctx.db.insert("digitalResources", {
          title: r.title,
          author: r.author,
          kind: r.kind,
          description: r.description,
          category: r.category,
          levelIds: [...r.levels],
          url: r.url,
          minutes: r.minutes,
          published: true,
          opens: 10 + i * 3,
          addedAt: daysAgo(20 - i),
        });
      }
      done.push("digital library");
    }

    if (!(await ctx.db.query("givingCampaigns").first())) {
      await ctx.db.insert("givingCampaigns", {
        slug: "library-books-for-every-class",
        title: "Library books for every class",
        summary: "Help us put a box of new reading books in every classroom.",
        description:
          "Every classroom at El-Bethel has a reading corner. This campaign buys a box of forty new, age-appropriate books for each one — stories by African authors, information books and early readers. Every naira goes on books, and we'll share photos of the new reading corners when they're stocked.",
        goal: 2_500_000,
        status: "open",
        createdAt: at,
      });
      done.push("giving");
    }

    return done;
  },
});
