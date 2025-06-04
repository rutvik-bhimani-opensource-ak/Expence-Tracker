# BudgetWise

BudgetWise is a personal finance management application designed to help users track their income and expenses, set budgets, and gain insights into their spending habits through reports and visualizations. It offers features like transaction management, budget goal setting, account tracking (including cash), and data export capabilities.

## Getting Started

This is a NextJS starter project. To get started, take a look at `src/app/page.tsx`.

Ensure you have a `.env` file configured with your Firebase credentials (you can use `.env.example` as a template).

## Tech Stack

This project is built with the following technologies:

- **Framework**: Next.js (using the App Router)
- **UI Library**: React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **AI Integration**: Genkit (Google AI)
- **Database**: Firebase Firestore
- **Charting**: Recharts
- **Data Tables**: TanStack Table
- **Date Utilities**: date-fns
- **Excel Export**: xlsx (SheetJS)
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod for validation

## Key Features

- Dashboard overview of finances
- Transaction tracking (income and expenses)
- Account management (main account and cash)
- Budget creation and progress tracking
- Monthly and yearly financial reports
- Data export to JSON and XLSX (month-wise)
- AI-powered transaction categorization
- Persistent data storage using Firebase Firestore
- Dark theme UI

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:9002](http://localhost:9002) (or the port specified in your `package.json` `dev` script) with your browser to see the result.
