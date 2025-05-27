import express from 'express';
import cors from 'cors'
import questionRoutes from './routes/questions.js';
import solutionRoutes from './routes/solutions.js';

const app = express();
app.use(cors());
app.use(express.json());

// Route handlers
app.use('/Question', questionRoutes);
app.use('/Solution', solutionRoutes);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
