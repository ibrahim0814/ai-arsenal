# AI Arsenal 🚀

AI Arsenal is something I build for myself to keep up with all of the latest AI related news. It aggregates and catalogs the AI tools that I personally use or am interested in. It's build with Next.js, TypeScript, and Supabase.

## Features ✨

- **Automated Tool Processing**: Input a URL, and the system automatically:

  - Extracts relevant content from the webpage
  - Generates concise descriptions using OpenAI GPT-3.5
  - Categorizes and stores the tool information

- **Admin Dashboard**: Secure admin interface to:

  - Add new AI tools
  - Edit existing entries
  - Remove outdated tools
  - Manage the tool catalog

- **Media Management**:

  - Add, edit, and delete AI-related articles, tweets, and media
  - Auto-detect content type from URL
  - Rich tweet embeds
  - Article summaries using AI

- **Modern UI**: Built with:
  - Tailwind CSS for styling
  - Shadcn/UI components
  - Responsive design for all devices

## Tech Stack 🛠️

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Supabase
- **AI Integration**: OpenAI GPT-3.5 for description generation
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + Shadcn/UI
- **Web Scraping**: Cheerio
- **Utilities**:
  - `clsx` and `tailwind-merge` for class management
  - `react-hook-form` for form handling
  - `react-tweet` for tweet embedding

## API Endpoints

- **Tool Management**:

  - `/api/tools`: CRUD operations for tools
  - `/api/fetch-and-describe`: Fetch and describe tools using Perplexity API

- **Media Management**:

  - `/api/media`: CRUD operations for media items
  - `/api/media/summarize`: Summarize media content using OpenAI

- **Webpage Content Fetching**:
  - `/api/fetch-webpage`: Fetch and parse webpage content using Cheerio

## Database Schema

- **Tools**: Stores information about AI tools
- **Media Items**: Stores AI-related articles, tweets, and media

## Installation and Setup

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Set up environment variables in `.env` file.
4. Run the development server using `npm run dev`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
