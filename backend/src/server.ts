import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { streamsRouter } from './routes/streams';
import { studentsRouter } from './routes/students';
import { subjectsRouter } from './routes/subjects';
import { scoresRouter } from './routes/scores';
import { resultsRouter } from './routes/results';
import { reportsRouter } from './routes/reports';
import { gradingRouter } from './routes/grading';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & parsing
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
      : '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/streams', streamsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/results', resultsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/grading', gradingRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler — must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Ikonex SMS API running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});

export default app;
